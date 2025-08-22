// routes/books.routes.js
const express = require('express');
const router = express.Router();
const booksController = require('../controllers/books.controller');

// Tous les versets d'un livre
router.get('/:bookId/verses', booksController.getVerses);

// Un verset spécifique d'un livre
router.get('/:bookId/verses/:id', booksController.getVerse);

// Tous les versets d'un chapitre spécifique
router.get('/:bookId/:chapterNum/verses', booksController.getChapterVerses);

// Un verset spécifique d'un chapitre
router.get('/:bookId/:chapterNum/:verseNum', booksController.getVerseInChapter);

// Tous les versets d'un chapitre via code livre
router.get('/code/:bookCode/:chapterNum/verses', booksController.getChapterVersesByCode);

// Un verset spécifique via code livre
router.get('/code/:bookCode/:chapterNum/:verseNum', booksController.getVerseInChapterByCode);

module.exports = router;
