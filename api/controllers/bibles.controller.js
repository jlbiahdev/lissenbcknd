// controllers/bibles.controller.js
const biblesService = require('../services/bibles.service');

async function getBooks(req, res) {
  const { code } = req.params;

  try {
    const books = await biblesService.getBooks(code);
    res.json(books);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getBook(req, res) {
  const { code, bookId } = req.params;

  try {
    const book = await biblesService.getBook(code, bookId);
    res.json(book);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  getBooks,
  getBook,
};
