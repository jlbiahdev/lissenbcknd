// controllers/theme.controller.js
const ThemeService = require('../services/theme.service');

async function getThemes(req, res) {
  try {
    const themes = await ThemeService.getAllThemes();
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération thèmes', details: err.message });
  }
}

async function postTheme(req, res) {
  try {
    const raw = req.body.name;
    if (!raw || typeof raw !== 'string') {
      return res.status(400).json({ error: 'Nom de thème invalide' });
    }

    const trimmed = raw.trim();
    const result = await ThemeService.addTheme(trimmed);

    if (result.alreadyExists) return res.status(409).json({ message: 'Thème déjà existant' });
    return res.status(201).json({ message: 'Thème ajouté avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur ajout thème', details: err.message });
  }
}

module.exports = { getThemes, postTheme };
