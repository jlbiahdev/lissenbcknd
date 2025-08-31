// services/meditation.service.js
const {
  sequelize,
  Meditation,
  MeditationVerse,
  Verse,
  Chapter,
  Book,
  Theme,
  VerseTheme,
} = require('../models');
const { Op } = require('sequelize');
const { formatToExport, formatToView } = require('../helpers/exportFormatter');

// ---------- Helpers ----------
async function findLinkedMeditation(verseId, t) {
  // on prend "la" méditation liée (s'il y en avait plusieurs, on prend la plus récente)
  const mv = await MeditationVerse.findOne({
    where: { verse_id: verseId },
    order: [['created_at', 'DESC']],
    transaction: t,
  });
  if (!mv) return null;
  return Meditation.findByPk(mv.meditation_id, { transaction: t });
}

async function linkVerseToMeditation(verseId, meditationId, t) {
  await MeditationVerse.findOrCreate({
    where: { meditation_id: meditationId, verse_id: verseId },
    defaults: { meditation_id: meditationId, verse_id: verseId },
    transaction: t,
  });
}

async function unlinkVerseFromMeditation(verseId, meditationId, t) {
  await MeditationVerse.destroy({
    where: { meditation_id: meditationId, verse_id: verseId },
    transaction: t,
  });
  // si la méditation n'a plus de verset → on la supprime (même UX qu'avant)
  const rest = await MeditationVerse.count({
    where: { meditation_id: meditationId },
    transaction: t,
  });
  if (rest === 0) {
    await Meditation.destroy({ where: { id: meditationId }, transaction: t });
  }
}

async function resolveThemeIds(input, t) {
  if (!input || !Array.isArray(input) || input.length === 0) return [];
  const ids = [];
  for (const item of input) {
    if (item == null) continue;
    if (Number.isInteger(item)) { ids.push(item); continue; }
    if (typeof item === 'object' && Number.isInteger(item.id)) { ids.push(item.id); continue; }
    if (typeof item === 'string') {
      const name = item.trim();
      if (!name) continue;
      const [row] = await Theme.findOrCreate({
        where: { name },
        defaults: { name, categoryId: 1, keywords: [] }, // ⚠️ ajuste si catégorie par défaut différente
        transaction: t,
      });
      ids.push(row.id);
    }
  }
  return Array.from(new Set(ids));
}

async function setVerseThemes(verseId, themeIds, t) {
  // remplace l'ensemble (idempotent via PK composite)
  await VerseTheme.destroy({ where: { verse_id: verseId }, transaction: t });
  if (!themeIds?.length) return;
  const rows = themeIds.map(id => ({ verse_id: verseId, theme_id: id }));
  await VerseTheme.bulkCreate(rows, { ignoreDuplicates: true, transaction: t });
}

// ---------- API ----------
async function insert(verseId) {
  return sequelize.transaction(async (t) => {
    // crée une méditation approuvée et lie le verset
    const med = await Meditation.create({
      commentary: null,
      approved: true,
      commentaryUpdatedAt: null,
    }, { transaction: t });

    await linkVerseToMeditation(verseId, med.id, t);
    return med;
  });
}

async function remove(verseId) {
  return sequelize.transaction(async (t) => {
    const med = await findLinkedMeditation(verseId, t);
    if (!med) throw new Error('Meditation not found');
    await unlinkVerseFromMeditation(verseId, med.id, t);
    return { success: true };
  });
}

async function toggleApproval(verseId) {
  return sequelize.transaction(async (t) => {
    let med = await findLinkedMeditation(verseId, t);
    if (!med) {
      med = await Meditation.create({
        commentary: null,
        approved: true,
        commentaryUpdatedAt: null,
      }, { transaction: t });
      await linkVerseToMeditation(verseId, med.id, t);
      return med;
    }
    med.approved = !med.approved;
    await med.save({ transaction: t });
    return med;
  });
}

async function update(verseId, commentary, themes) {
  return sequelize.transaction(async (t) => {
    // 1) trouver/créer une méditation liée au verset
    let med = await findLinkedMeditation(verseId, t);
    if (!med) {
      med = await Meditation.create({
        commentary: null,
        approved: false,
        commentaryUpdatedAt: null,
      }, { transaction: t });
      await linkVerseToMeditation(verseId, med.id, t);
    }

    // 2) maj commentaire + reset approved=false
    med.commentary = commentary ?? null;
    med.approved = false;
    med.commentaryUpdatedAt = new Date();
    await med.save({ transaction: t });

    // 3) normaliser les thèmes -> IDs, puis remplacer les thèmes DU VERSET
    const themeIds = await resolveThemeIds(themes, t);
    await setVerseThemes(verseId, themeIds, t);

    return med;
  });
}

async function addTheme(verseId, theme) {
  return sequelize.transaction(async (t) => {
    // accepte string|number|(array mix) : on ajoute sur le VERSE (pas la meditation)
    const input = Array.isArray(theme) ? theme : [theme];
    const ids = await resolveThemeIds(input, t);

    if (!ids.length) throw new Error('Theme not found ' + theme);

    const existing = await VerseTheme.findAll({
      where: { verse_id: verseId, theme_id: { [Op.in]: ids } },
      attributes: ['theme_id'],
      transaction: t,
    });
    const have = new Set(existing.map(r => r.theme_id));
    const toAdd = ids.filter(id => !have.has(id));
    if (toAdd.length) {
      await VerseTheme.bulkCreate(
        toAdd.map(id => ({ verse_id: verseId, theme_id: id })),
        { ignoreDuplicates: true, transaction: t }
      );
    }

    // retour minimal : la meditation liée (si existante)
    return await findLinkedMeditation(verseId, t);
  });
}

async function removeTheme(verseId, theme) {
  return sequelize.transaction(async (t) => {
    // theme peut être id ou nom
    let ids = [];
    if (Array.isArray(theme)) {
      ids = await resolveThemeIds(theme, t);
    } else if (Number.isInteger(theme)) {
      ids = [theme];
    } else if (typeof theme === 'string') {
      const row = await Theme.findOne({ where: { name: theme }, attributes: ['id'], transaction: t });
      if (row) ids = [row.id];
    }
    if (!ids.length) return await findLinkedMeditation(verseId, t);

    await VerseTheme.destroy({
      where: { verse_id: verseId, theme_id: { [Op.in]: ids } },
      transaction: t,
    });

    return await findLinkedMeditation(verseId, t);
  });
}

async function exportMeditations() {
  // on exporte les méditations approuvées + leurs versets (avec Book via Chapter)
  const data = await Meditation.findAll({
    where: { approved: true },
    include: [{
      model: Verse,
      as: 'verses',
      through: { attributes: [] },
      include: [{
        model: Chapter, as: 'chapter',
        include: [{ model: Book, as: 'book' }]
      }]
    }],
    order: [['id', 'ASC']],
  });

  return formatToExport(data);
}

async function getByBook(bookId) {
  const data = await Meditation.findAll({
    include: [{
      model: Verse,
      as: 'verses',
      through: { attributes: [] },
      include: [{
        model: Chapter, as: 'chapter',
        where: { bookId },
        required: true,
      }]
    }],
  });

  const formatted = !data ? null : data.map(formatToView);
  return formatted;
}

async function getByBookAndChapter(bookId, chapterNum) {
  const data = await Meditation.findAll({
    include: [{
      model: Verse,
      as: 'verses',
      through: { attributes: [] },
      include: [{
        model: Chapter, as: 'chapter',
        where: { bookId, number: chapterNum },
        required: true,
      }]
    }],
  });

  const formatted = !data ? null : data.map(formatToView);
  return formatted;
}

async function getByBookChapterVerse(bookId, chapterNum, verseNum) {
  const data = await Meditation.findOne({
    include: [{
      model: Verse,
      as: 'verses',
      where: { number: verseNum },
      required: true,
      include: [{
        model: Chapter, as: 'chapter',
        where: { bookId, number: chapterNum },
        required: true,
      }]
    }]
  });

  return !data ? null : formatToView(data);
}

module.exports = {
  insert,
  toggleApproval,
  update,
  addTheme,
  remove,
  removeTheme,
  exportMeditations,
  getByBook,
  getByBookAndChapter,
  getByBookChapterVerse
};
