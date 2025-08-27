// routes/meditations.routes.js
const express = require('express');
const router = express.Router();
const meditationsController = require('../controllers/meditations.controller');

// Approuver ou désapprouver une méditation
router.post('/:verseId/add', meditationsController.insert);
router.post('/:verseId/remove', meditationsController.remove);

// Ajouter ou modifier un commentaire
router.put('/:verseId/edit', meditationsController.edit);

// Approuver ou désapprouver un commentaire
router.post('/:verseId/approve', meditationsController.toggleApproval);

// Ajouter des thèmes à une méditation
router.post('/:verseId/themes', meditationsController.addTheme);

// Supprimer un thème d'une méditation
router.delete('/:verseId/themes/:theme', meditationsController.removeTheme);

// Exporter les méditations au format Lissen
router.get('/export', meditationsController.exportMeditations);

router.get('/book/:bookId', meditationsController.getByBook);

router.get('/book/:bookId/chapter/:chapterNum', meditationsController.getByBookAndChapter);

router.get('/book/:bookId/chapter/:chapterNum/verse/:verseNum', meditationsController.getByBookChapterVerse);

module.exports = router;