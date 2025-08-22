// controllers/books.controller.js
const booksService = require('../services/books.service');

async function getVerses(req, res) {
  const { bookId } = req.params;

  try {
    const verses = await booksService.getVerses(bookId);
    res.json(verses);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getVerse(req, res) {
  const { bookId, id } = req.params;

  try {
    const verse = await booksService.getVerse(bookId, id);
    res.json(verse);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getChapterVerses(req, res) {
  const { bookId, chapterNum } = req.params;

  try {
    const verses = await booksService.getChapterVerses(bookId, chapterNum);
    res.json(verses);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getVerseInChapter(req, res) {
  const { bookId, chapterNum, verseNum } = req.params;

  try {
    const verse = await booksService.getVerseInChapter(bookId, chapterNum, verseNum);
    res.json(verse);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getChapterVersesByCode(req, res) {
  const { bookCode, chapterNum } = req.params;

  try {
    const verses = await booksService.getChapterVersesByCode(bookCode, chapterNum);
    res.json(verses);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getVerseInChapterByCode(req, res) {
  const { bookCode, chapterNum, verseNum } = req.params;

  try {
    const verse = await booksService.getVerseInChapterByCode(bookCode, chapterNum, verseNum);
    res.json(verse);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  getVerses,
  getVerse,
  getChapterVerses,
  getChapterVersesByCode,
  getVerseInChapter,
  getVerseInChapterByCode,
};
