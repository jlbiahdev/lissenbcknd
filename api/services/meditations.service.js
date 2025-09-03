// services/meditations.service.js
const {
  sequelize,
  Meditation,
  MeditationVerse,
  Verse,
  Chapter,
  Book,
  Theme,
  VerseTheme,
  CategoryTheme,
} = require('../models');
const { Op } = require('sequelize');
const { formatToExport, formatToView } = require('../helpers/exportFormatter');

// ---------- Helpers ----------
async function findLinkedMeditation(verseId, t) {
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
  const rest = await MeditationVerse.count({
    where: { meditation_id: meditationId },
    transaction: t,
  });
  if (rest === 0) {
    await Meditation.destroy({ where: { id: meditationId }, transaction: t });
  }
}

// Récupère une catégorie par défaut (1er en base), mise en cache simple process.
let _defaultCategoryId = null;
async function getDefaultCategoryId(t) {
  if (_defaultCategoryId) return _defaultCategoryId;
  const cat = await CategoryTheme.findOne({
    attributes: ['id'],
    order: [['id', 'ASC']],
    transaction: t,
  });
  if (!cat) {
    throw new Error("Aucune catégorie de thème disponible pour créer un nouveau thème.");
  }
  _defaultCategoryId = cat.id;
  return _defaultCategoryId;
}

/**
 * Accepte: [1, 3] | [{id:1}, {id:3}] | ["Amour", "Foi"] | mix des trois.
 * Retourne: tableau d'IDs (entiers) existants (créés si nécessaire quand string).
 * - Recherche case-insensitive par nom.
 * - Si non trouvé et string → crée le thème avec une catégorie par défaut (1er CategoryTheme) et keywords=[].
 */
async function resolveThemeIds(input, t) {
  if (!input || !Array.isArray(input) || input.length === 0) return [];

  const ids = [];
  for (const item of input) {
    if (item == null) continue;

    // id direct
    if (Number.isInteger(item)) {
      ids.push(item);
      continue;
    }

    // objet avec id
    if (typeof item === 'object' && Number.isInteger(item.id)) {
      ids.push(item.id);
      continue;
    }

    // libellé → case-insensitive find, sinon create avec catégorie par défaut
    if (typeof item === 'string') {
      const name = item.trim();
      if (!name) continue;

      const existing = await Theme.findOne({
        where: { name: { [Op.iLike]: name } }, // égalité insensible à la casse
        attributes: ['id'],
        transaction: t,
      });

      if (existing) {
        ids.push(existing.id);
        continue;
      }

      // créer le thème avec une catégorie par défaut dynamique
      const defaultCategoryId = await getDefaultCategoryId(t);
      const created = await Theme.create(
        { name, categoryId: defaultCategoryId, keywords: [] },
        { transaction: t }
      );
      ids.push(created.id);
      continue;
    }

    // sinon on ignore
  }

  return Array.from(new Set(ids));
}

async function setVerseThemes(verseId, themeIds, t) {
  await VerseTheme.destroy({ where: { verse_id: verseId }, transaction: t });
  if (!themeIds?.length) return;
  const rows = themeIds.map(id => ({ verse_id: verseId, theme_id: id }));
  await VerseTheme.bulkCreate(rows, { ignoreDuplicates: true, transaction: t });
}

// ---------- API ----------
async function insert(verseId) {
  return sequelize.transaction(async (t) => {
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
    let med = await findLinkedMeditation(verseId, t);
    if (!med) {
      med = await Meditation.create({
        commentary: null,
        approved: false,
        commentaryUpdatedAt: null,
      }, { transaction: t });
      await linkVerseToMeditation(verseId, med.id, t);
    }

    med.text = commentary ?? null;
    med.approved = false;
    med.commentaryUpdatedAt = new Date();
    await med.save({ transaction: t });

    const themeIds = await resolveThemeIds(themes, t);
    await setVerseThemes(verseId, themeIds, t);

    return med;
  });
}

async function addTheme(verseId, theme) {
  return sequelize.transaction(async (t) => {
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

    return await findLinkedMeditation(verseId, t);
  });
}

async function removeTheme(verseId, theme) {
  return sequelize.transaction(async (t) => {
    let ids = [];
    if (Array.isArray(theme)) {
      ids = await resolveThemeIds(theme, t);
    } else if (Number.isInteger(theme)) {
      ids = [theme];
    } else if (typeof theme === 'string') {
      const row = await Theme.findOne({
        where: { name: { [Op.iLike]: theme.trim() } }, // case-insensitive
        attributes: ['id'],
        transaction: t
      });
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
