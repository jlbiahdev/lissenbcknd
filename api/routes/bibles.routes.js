// routes/bibles.routes.js
const express = require('express');
const router = express.Router();
const biblesController = require('../controllers/bibles.controller');

router.get('/:code/books', biblesController.getBooks);
router.get('/:code/books/:bookId', biblesController.getBook);

module.exports = router;
