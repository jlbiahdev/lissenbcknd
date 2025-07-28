// services/bibles.service.js
const { Bible, Book } = require('../models');

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

module.exports = {
  getBooks,
  getBook,
};
