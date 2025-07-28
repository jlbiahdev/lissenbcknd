// routes/books.routes.js
const express = require('express');
const router = express.Router();
const booksController = require('../controllers/books.controller');

// Tous les versets d'un livre
router.get('/:bookId/verses', booksController.getVerses);

// Un verset spécifique d'un livre
router.get('/:bookId/verses/:id', booksController.getVerse);

module.exports = router;
