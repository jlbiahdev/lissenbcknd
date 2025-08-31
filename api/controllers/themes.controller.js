// controllers/theme.controller.js
const ThemeService = require('../services/themes.service');

function toInt(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function isNonEmptyString(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

function isStringArray(a) {
  return Array.isArray(a) && a.every(x => typeof x === 'string');
}

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
    const { name, categoryId, keywords } = req.body || {};

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Nom de thème invalide' });
    }
    const catId = toInt(categoryId);
    if (!catId) {
      return res.status(400).json({ error: 'categoryId manquant ou invalide' });
    }
    if (!isStringArray(keywords)) {
      return res.status(400).json({ error: 'keywords doit être un tableau de chaînes' });
    }

    const result = await ThemeService.add({ name: name.trim(), categoryId: catId, keywords });

    if (result.alreadyExists) return res.status(409).json({ message: 'Thème déjà existant' });
    if (result.invalidCategory) return res.status(400).json({ message: 'Catégorie invalide' });

    return res.status(201).json({ message: 'Thème ajouté avec succès', id: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Erreur ajout thème', details: err.message });
  }
}

async function edit(req, res) {
  try {
    const id = toInt(req.params.id);
    const { name, categoryId, keywords } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: 'Paramètre id invalide' });
    }

    const patch = {};
    if (name !== undefined) {
      if (!isNonEmptyString(name)) return res.status(400).json({ error: 'Nom de thème invalide' });
      patch.name = name.trim();
    }
    if (categoryId !== undefined) {
      const catId = toInt(categoryId);
      if (!catId) return res.status(400).json({ error: 'categoryId invalide' });
      patch.categoryId = catId;
    }
    if (keywords !== undefined) {
      if (!isStringArray(keywords)) return res.status(400).json({ error: 'keywords doit être un tableau de chaînes' });
      patch.keywords = keywords;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'Aucune mise à jour fournie' });
    }

    const result = await ThemeService.edit(id, patch);

    if (result.notFound) return res.status(404).json({ message: 'Thème non trouvé' });
    if (result.alreadyExists) return res.status(409).json({ message: 'Nom de thème déjà existant' });
    if (result.invalidCategory) return res.status(400).json({ message: 'Catégorie invalide' });

    return res.status(200).json({ message: 'Thème modifié avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur modification thème', details: err.message });
  }
}

module.exports = { getThemes, add, edit };
