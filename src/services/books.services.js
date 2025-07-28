// services/books.service.js
const { Book, Verse } = require('../models');

async function getVerses(bookId) {
  const book = await Book.findByPk(bookId, {
    include: [{ model: Verse, as: 'Verses' }],
  });

  if (!book) {
    throw new Error(`Book with id '${bookId}' not found`);
  }

  return book.Verses;
}

async function getVerse(bookId, verseId) {
  const verse = await Verse.findOne({
    where: {
      id: verseId,
      bookId,
    },
  });

  if (!verse) {
    throw new Error(`Verse with id '${verseId}' not found in book '${bookId}'`);
  }

  return verse;
}

module.exports = {
  getVerses,
  getVerse,
};
