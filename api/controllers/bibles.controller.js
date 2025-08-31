// controllers/bibles.controller.js
const biblesService = require('../services/bibles.service');

function toInt(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toStr(v) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

async function getBooks(req, res) {
  const code = toStr(req.params.code);
  try {
    const books = await biblesService.getBooks(code);
    res.json(books);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getBook(req, res) {
  const code = toStr(req.params.code);
  const bookId = toInt(req.params.bookId);

  try {
    const book = await biblesService.getBook(code, bookId);
    res.json(book);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function getVerses(req, res) {
  try {
    const bible        = toStr(req.query.bible);
    const book         = toStr(req.query.book);     // book name like
    const chapter      = toInt(req.query.chapter);
    const textLike     = toStr(req.query.textLike);
    const isMeditative = req.query.isMeditative !== undefined ? toInt(req.query.isMeditative) : undefined;
    const isApproved   = req.query.isApproved   !== undefined ? toInt(req.query.isApproved)   : undefined;

    const items = await biblesService.getVerses(bible, book, chapter, textLike, isMeditative, isApproved);

    res.json({ items, total: items.length });
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
