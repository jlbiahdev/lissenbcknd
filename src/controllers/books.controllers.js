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

module.exports = {
  getVerses,
  getVerse,
};
