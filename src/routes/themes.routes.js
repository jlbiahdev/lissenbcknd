// routes/themes.routes.js
const express = require('express');
const router = express.Router();
const themesController = require('../controllers/themes.controller');

// Liste des thèmes
router.get('/', themesController.getAllThemes);

// Ajouter un thème
router.post('/', themesController.addTheme);

module.exports = router;