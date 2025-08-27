// services/bibles.service.js
const { Bible, Book, Verse, MeditativeVerse } = require('../models');

async function getBooks(code) {
  const bible = await Bible.findOne({
    where: { code },
    include: [{ model: Book, as: 'Books' }],
  });

  if (!bible) {
    throw new Error(`Bible with code '${code}' not found`);
  }

  return bible.Books;
}

async function getBook(code, bookId) {
  const bible = await Bible.findOne({
    where: { code },
    include: [{
      model: Book,
      as: 'Books',
      where: { id: bookId },
      required: true,
    }],
  });

  if (!bible || bible.Books.length === 0) {
    throw new Error(`Book with id '${bookId}' not found in bible '${code}'`);
  }

  return bible.Books[0];
}

async function getVerses(bookId, meditative, approved, offset, limit) {
  const where = {};
  if (bookId) where.bookId = bookId;

  // base query : Verse + Book + MeditativeVerse
  const { rows, count } = await Verse.findAndCountAll({
    where,
    attributes: { exclude: ['bookId'] },
    include: [
      { model: Book, as: 'Book', attributes: ["id", "name", "code", "bibleCode"] },
      { model: MeditativeVerse, as: 'Meditative', attributes: ["id", "themes", "commentary", "approved"] }
    ],
    offset,
    limit,
    order: [["id", "ASC"]],
    distinct: true,
  });

  // filtrage supplémentaire (méditatif/approved) côté JS si besoin
  let items = rows;
  if (meditative === "1") {
    items = items.filter(v => v.meditative_verse != null);
  }
  if (approved === "1" || approved === "0") {
    const isApproved = approved === "1";
    items = items.filter(v => v.meditative_verse?.approved === isApproved);
  }

  // Ajoute les bibles à chaque item
  const bibleCodes = [...new Set(items.map(v => v.Book?.bibleCode).filter(Boolean))];
  const bibles = await Bible.findAll({ where: { code: bibleCodes } });

  items = items.map(v => {
    const bible = bibles.find(b => b.code === v.Book?.bibleCode);
    return { ...v.toJSON(), Bible: bible ? bible.toJSON() : null };
  });

  return items;
}

module.exports = {
  getBooks,
  getBook,
  getVerses,
};
