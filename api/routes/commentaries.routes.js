const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/commentaries.controller');

// CREATE
router.post('/', ctrl.add);

// READ (list + filtered)
router.get('/', ctrl.get);
// READ (by id)
router.get('/:id', ctrl.getById);

// UPDATE (text)
router.put('/:id', ctrl.update);

// DELETE
router.delete('/:id', ctrl.remove);

// EXPORT (single commentary)
router.get('/:id/export', ctrl.exportOne);

// TOGGLE APPROVAL
router.post('/:id/toggle', ctrl.toggleApproval);

module.exports = router;
