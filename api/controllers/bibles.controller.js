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

async function getVerses(req, res) {
  try {
    const { page = 1, pageSize = 20, bookId, meditative, approved } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize, 10);
    const items = await biblesService.getVerses(bookId, meditative, approved, offset, limit);
    res.json({
      items,
      total: items.length,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (error) {
    console.error("getVerses error:", error);
    res.status(500).json({ message: "Erreur getVerses" });
  }
}

module.exports = {
  getBook,
  getBooks,
  getVerses,
};
