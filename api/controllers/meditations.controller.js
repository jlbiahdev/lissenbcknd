// controllers/meditations.controller.js
const meditationService = require('../services/meditations.service');

async function toggleApproval(req, res) {
  const { verseId } = req.params;
  try {
    const result = await meditationService.toggleApproval(verseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function toggleCommentaryApproval(req, res) {
  const { verseId } = req.params;
  try {
    const result = await meditationService.toggleCommentaryApproval(verseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateCommentary(req, res) {
  const { verseId } = req.params;
  const { commentary } = req.body;
  try {
    const result = await meditationService.updateCommentary(verseId, commentary);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function addTheme(req, res) {
  const { verseId } = req.params;
  const { theme } = req.body;
  try {
    const result = await meditationService.addTheme(verseId, theme);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function removeTheme(req, res) {
  const { verseId, theme } = req.params;
  try {
    const result = await meditationService.removeTheme(verseId, theme);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function exportMeditations(req, res) {
  try {
    const json = await meditationService.exportMeditations();
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getByBook(req, res) {
  const { bookId } = req.params;
  try {
    const data = await meditationService.getByBook(bookId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getByBookAndChapter(req, res) {
  const { bookId, chapterNum } = req.params;
  try {
    const data = await meditationService.getByBookAndChapter(bookId, chapterNum);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getByBookChapterVerse(req, res) {
  const { bookId, chapterNum, verseNum } = req.params;
  try {
    const data = await meditationService.getByBookChapterVerse(bookId, chapterNum, verseNum);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  getByBookChapterVerse,
};