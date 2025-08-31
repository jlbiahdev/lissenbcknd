// controllers/books.controller.js
const booksService = require('../services/books.service');

function toInt(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

async function getVerses(req, res) {
  const bookId = toInt(req.params.bookId);

  try {
    const verses = await booksService.getVerses(bookId);
    res.json(verses);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getVerse(req, res) {
  const bookId = toInt(req.params.bookId);
  const id = toInt(req.params.id);

  try {
    const verse = await booksService.getVerse(bookId, id);
    res.json(verse);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getChapterVerses(req, res) {
  const bookId = toInt(req.params.bookId);
  const chapterNum = toInt(req.params.chapterNum);

  try {
    const verses = await booksService.getChapterVerses(bookId, chapterNum);
    res.json(verses);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getVerseInChapter(req, res) {
  const bookId = toInt(req.params.bookId);
  const chapterNum = toInt(req.params.chapterNum);
  const verseNum = toInt(req.params.verseNum);

  try {
    const verse = await booksService.getVerseInChapter(bookId, chapterNum, verseNum);
    res.json(verse);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getChapterVersesByCode(req, res) {
  const bookCode = req.params.bookCode;
  const chapterNum = toInt(req.params.chapterNum);

  try {
    const verses = await booksService.getChapterVersesByCode(bookCode, chapterNum);
    res.json(verses);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getVerseInChapterByCode(req, res) {
  const bookCode = req.params.bookCode;
  const chapterNum = toInt(req.params.chapterNum);
  const verseNum = toInt(req.params.verseNum);

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
