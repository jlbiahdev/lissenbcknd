// controllers/meditations.controller.js
const meditationsService = require('../services/meditations.service');

async function toggleApproval(req, res) {
  const { verseId } = req.params;
  try {
    const result = await meditationsService.toggleApproval(verseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateCommentary(req, res) {
  const { verseId } = req.params;
  const { commentary } = req.body;
  try {
    const result = await meditationsService.updateCommentary(verseId, commentary);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function addTheme(req, res) {
  const { verseId } = req.params;
  const { themeId } = req.body;
  try {
    const result = await meditationsService.addTheme(verseId, themeId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function removeTheme(req, res) {
  const { verseId, themeId } = req.params;
  try {
    const result = await meditationsService.removeTheme(verseId, themeId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function exportMeditations(req, res) {
  try {
    const json = await meditationsService.exportMeditations();
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  toggleApproval,
  updateCommentary,
  addTheme,
  removeTheme,
  exportMeditations,
};