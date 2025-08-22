// services/meditations.service.js
const { MeditativeVerse, Book, Theme, Verse } = require('../models');
const { formatToExport, formatToView } = require('../helpers/exportFormatter');

async function toggleApproval(verseId) {
  const [meditation, created] = await MeditativeVerse.findOrCreate({
    where: { verseId },
    defaults: { verseApproved: true },
  });

  if (!created) {
    meditation.verseApproved = !meditation.verseApproved;
    await meditation.save();
  }

  return meditation;
}

async function toggleCommentaryApproval(verseId) {
  const [meditation, created] = await MeditativeVerse.findOrCreate({
    where: { verseId },
    defaults: { commentApproved: true },
  });

  console.log('meditation:', meditation);
  if (!created) {
    meditation.commentApproved = !meditation.commentApproved;
    await meditation.save();
  }

  return meditation;
}

async function updateCommentary(verseId, commentary) {
  const [meditation] = await MeditativeVerse.findOrCreate({
    where: { verseId },
  });
  meditation.commentary = commentary;
  meditation.verseApproved = false;
  await meditation.save();
  return meditation;
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
  toggleApproval,
  toggleCommentaryApproval,
  updateCommentary,
  addTheme,
  removeTheme,
  exportMeditations,
  getByBook,
  getByBookAndChapter,
  getByBookChapterVerse
};
