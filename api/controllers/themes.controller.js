// controllers/theme.controller.js
const ThemeService = require('../services/themes.service');

async function getThemes(req, res) {
  try {
    const themes = await ThemeService.getAll();
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération thèmes', details: err.message });
  }
}

async function add(req, res) {
  try {
    console.log('Adding theme:', req.body.name);
    const raw = req.body.name;
    if (!raw || typeof raw !== 'string') {
      return res.status(400).json({ error: 'Nom de thème invalide' });
    }

    const trimmed = raw.trim();
    const result = await ThemeService.add(trimmed);

    if (result.alreadyExists) return res.status(409).json({ message: 'Thème déjà existant' });
    return res.status(201).json({ message: 'Thème ajouté avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur ajout thème', details: err.message });
  }
}

async function edit(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id || !name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Paramètres invalides' });
    }

    const trimmedName = name.trim();
    const result = await ThemeService.edit(id, trimmedName);

    if (result.notFound) return res.status(404).json({ message: 'Thème non trouvé' });
    if (result.alreadyExists) return res.status(409).json({ message: 'Nom de thème déjà existant' });

    return res.status(200).json({ message: 'Thème modifié avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur modification thème', details: err.message });
  }
}

module.exports = { getThemes, add, edit };