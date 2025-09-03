const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/commentaries.controller');

// CREATE
router.post('/', ctrl.createCommentary);

// READ (list + filtered)
router.get('/', ctrl.listCommentaries);
// READ (by id)
router.get('/:id', ctrl.getById);

// UPDATE (text)
router.put('/:id', ctrl.updateCommentary);
// TOGGLE approval
router.post('/:id/toggle', ctrl.toggleApproval);

// DELETE
router.delete('/:id', ctrl.deleteCommentary);

// VERSE LINKS
router.post('/:id/verses', ctrl.addVerse);
router.delete('/:id/verses/:verseId', ctrl.removeVerse);

// EXPORT (single commentary)
router.get('/:id/export', ctrl.exportOne);

module.exports = router;
