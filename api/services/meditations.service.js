const { sequelize, MeditativeVerse, Book, Theme, Verse } = require('../models');
const { formatToExport, formatToView } = require('../helpers/exportFormatter');

async function insert(verseId) {
  const meditation = await MeditativeVerse.create({
    verseId,
    verseApproved: true,
  });
  return meditation;
}

async function remove(verseId) {
  const meditation = await MeditativeVerse.findOne({ where: { verseId } });
  if (!meditation) throw new Error('Meditation not found');
  await meditation.destroy();
  return { success: true };
}

async function toggleCommentaryApproval(verseId) {
  const [meditation, created] = await MeditativeVerse.findOrCreate({
    where: { verseId },
    defaults: { commentApproved: true },
  });

  if (!created) {
    meditation.commentApproved = !meditation.commentApproved;
    await meditation.save();
  }

  return meditation;
}

async function update(verseId, commentary, themes) {
  return sequelize.transaction(async (t) => {
    // 1) trouver/créer la ligne meditative_verses
    const [meditation] = await MeditativeVerse.findOrCreate({
      where: { verseId },
      defaults: { approved: false },
      transaction: t,
    });

    // 2) maj commentaire + approuvé (reset à false si on édite le commentaire)
    await meditation.update(
      { commentary: commentary ?? null, approved: false },
      { transaction: t }
    );

    // 3) normaliser les thèmes -> IDs
    const themeIds = await resolveThemeIds(themes, t);

    // 4) poser la relation N-N (remplace tout l’ensemble)
    await meditation.setThemes(themeIds, { transaction: t });

    return meditation; // optionnel: .reload({ include: [{ model: Theme, as: 'themes' }], transaction: t })
  });
}

/**
 * Accepte: [1, 3] | [{id:1}, {id:3}] | ["Amour", "Foi"] | mix des trois.
 * Retourne: tableau d'IDs (entiers) existants (créés si nécessaire quand string).
 */
async function resolveThemeIds(input, transaction) {
  if (!input || !Array.isArray(input) || input.length === 0) return [];

  const ids = [];

  for (const item of input) {
    if (item == null) continue;

    // déjà un id number
    if (typeof item === 'number' && Number.isInteger(item)) {
      ids.push(item);
      continue;
    }

    // objet avec id
    if (typeof item === 'object' && item.id && Number.isInteger(item.id)) {
      ids.push(item.id);
      continue;
    }

    // libellé -> findOrCreate by name (trim + case insensitive à adapter selon ta contrainte)
    if (typeof item === 'string') {

      const name = item.trim();

      if (!name) continue;

      const [row] = await Theme.findOrCreate({
        where: { name },
        defaults: { name },
        transaction,
      });

      ids.push(row.id);

      continue;
    }

    // sinon on ignore silencieusement
  }

  // dédoublonner
  return Array.from(new Set(ids));
}

async function addTheme(verseId, theme) {
  const existingTheme = await Theme.findAll({ where: { name: theme } });
  if (!existingTheme || !existingTheme.length) throw new Error('Theme not found ' + theme);

  const meditation = await MeditativeVerse.findOne({ where: { verseId } });
  if (!meditation) throw new Error('Meditation not found');

  let currentThemes = meditation.themes;
  if (!Array.isArray(currentThemes)) {
    currentThemes = [];
  }

  // If theme is an array, add all unique themes
  if (Array.isArray(theme)) {
    const newThemes = theme.filter(t => !currentThemes.includes(t));
    meditation.themes = [...currentThemes, ...newThemes];
  } else {
    if (!currentThemes.includes(theme)) {
      meditation.themes = [...currentThemes, theme];
    }
  }

  await meditation.save();
  return meditation;
}

async function removeTheme(verseId, theme) {
  const meditation = await MeditativeVerse.findOne({ where: { verseId } });
  if (!meditation) throw new Error('Meditation not found');

  meditation.themes = (meditation.themes || []).filter(t => t !== theme);
  await meditation.save();

  return meditation;
}

async function exportMeditations() {
  const data = await MeditativeVerse.findAll({
    where: { verseApproved: true },
    include: [
      { 
        model: Verse, 
        as: 'verse',
        include: [
          { model: Book, as: 'Book' }
        ]
      },
    ],
  });

 return formatToExport(data);
}

async function getByBook(bookId) {
  const data = await MeditativeVerse.findAll({
    include: [
      {
        model: Verse,
        as: 'verse',
        where: { bookId }
      }
    ]
  });

  const formatted = !data ? null : data.map(formatToView);
  return formatted;
}

async function getByBookAndChapter(bookId, chapterNum) {
  const data = await MeditativeVerse.findAll({
    include: [
      {
        model: Verse,
        as: 'verse',
        where: { bookId, chapterNum }
      }
    ]
  });

  const formatted = !data ? null : data.map(formatToView);
  return formatted;
}

async function getByBookChapterVerse(bookId, chapterNum, verseNum) {
  const data = await MeditativeVerse.findOne({
    include: [
      {
        model: Verse,
        as: 'verse',
        where: { bookId, chapterNum, verseNum }
      }
    ]
  });

  return !data ? null : formatToView(data);
}

module.exports = {
  insert,
  toggleCommentaryApproval,
  update,
  addTheme,
  remove,
  removeTheme,
  exportMeditations,
  getByBook,
  getByBookAndChapter,
  getByBookChapterVerse
};
