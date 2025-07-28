// routes/meditations.routes.js
const express = require('express');
const router = express.Router();
const meditationsController = require('../controllers/meditations.controller');

// Approuver ou désapprouver une méditation
router.post('/:verseId/toggle', meditationsController.toggleApproval);

// Ajouter ou modifier un commentaire
router.put('/:verseId/commentary', meditationsController.updateCommentary);

// Ajouter un thème à une méditation
router.post('/:verseId/themes', meditationsController.addTheme);

// Supprimer un thème d'une méditation
router.delete('/:verseId/themes/:themeId', meditationsController.removeTheme);

// Exporter les méditations au format Lissen
router.get('/export', meditationsController.exportMeditations);

module.exports = router;