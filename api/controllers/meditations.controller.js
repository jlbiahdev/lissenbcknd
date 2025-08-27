// controllers/meditations.controller.js
const meditationService = require('../services/meditations.service');

async function insert(req, res) {
  console.log('Inserting meditation for verse:', req.params.verseId);
  const { verseId } = req.params;
  try {
    const result = await meditationService.insert(verseId);
    res.json(result);
  } catch (error) {
    console.error('Error inserting meditation:', error);
    res.status(400).json({ error: error.message });
  }
}

async function remove(req, res) {
  console.log('Removing meditation for verse:', req.params.verseId);
  const { verseId } = req.params;
  try {
    const result = await meditationService.remove(verseId);
    res.json(result);
  } catch (error) {
    console.error('Error removing meditation:', error);
    res.status(400).json({ error: error.message });
  }
}

async function toggleApproval(req, res) {
  const { verseId } = req.params;
  try {
    console.log('Toggling approval for meditation:', verseId);
    const result = await meditationService.toggleApproval(verseId);
    res.json(result);
  } catch (error) {
    console.error('Error toggling approval:', error);
    res.status(400).json({ error: error.message });
  }
}

async function edit(req, res) {
  const { verseId } = req.params;
  const { commentary, themes } = req.body;
  try {
    const result = await meditationService.update(verseId, commentary, themes);
    res.json(result);
  } catch (error) {
    console.error('Error updating meditation:', error);
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
  insert,
  toggleApproval,
  edit,
  addTheme,
  remove,
  removeTheme,
  exportMeditations,
  getByBook,
  getByBookAndChapter,
  getByBookChapterVerse,
};