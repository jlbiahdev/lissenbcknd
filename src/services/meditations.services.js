// services/meditations.service.js
const { MeditativeVerse, Theme, Verse } = require('../models');

async function toggleApproval(verseId) {
  const [meditation, created] = await MeditativeVerse.findOrCreate({
    where: { verseId },
    defaults: { approved: true },
  });

  if (!created) {
    meditation.approved = !meditation.approved;
    await meditation.save();
  }

  return meditation;
}

async function updateCommentary(verseId, commentary) {
  const [meditation] = await MeditativeVerse.findOrCreate({
    where: { verseId },
  });
  meditation.commentary = commentary;
  meditation.approved = false;
  await meditation.save();
  return meditation;
}

async function addTheme(verseId, themeId) {
  const meditation = await MeditativeVerse.findOne({ where: { verseId } });
  if (!meditation) throw new Error('Meditation not found');
  await meditation.addTheme(themeId);
  return { success: true };
}

async function removeTheme(verseId, themeId) {
  const meditation = await MeditativeVerse.findOne({ where: { verseId } });
  if (!meditation) throw new Error('Meditation not found');
  await meditation.removeTheme(themeId);
  return { success: true };
}

async function exportMeditations() {
  const data = await MeditativeVerse.findAll({
    where: { approved: true },
    include: [
      { model: Verse, as: 'Verse' },
      { model: Theme, as: 'Themes' },
    ],
  });

  // Ici on peut brancher exportFormatter.js si nécessaire
  return data;
}

module.exports = {
  toggleApproval,
  updateCommentary,
  addTheme,
  removeTheme,
  exportMeditations,
};
