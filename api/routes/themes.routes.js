// routes/themes.routes.js
const express = require('express');
const router = express.Router();
const themesController = require('../controllers/themes.controller');

// Liste des thèmes
router.get('/', themesController.getThemes);

// Ajouter un thème
router.post('/', themesController.postTheme);

module.exports = router;