// services/bibles.service.js
const { Bible, Book, Verse, MeditativeVerse, Theme } = require('../models');
const { Op } = require('sequelize');

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

async function getVerses(bible, bookNameLike, chapter, textLike, isMeditative, isApproved) {
  const where = {};
  if (bookNameLike) {
    const bookWhere = {
      name: { [Op.iLike]: `%${bookNameLike}%` }, // iLike pour insensible à la casse
    };
    if (bible) {
      bookWhere.bibleCode = bible;
    }
    const books = await Book.findAll({
      where: bookWhere,
      attributes: ['id'],
    });
    const bookIds = books.map(b => b.id);
    if (bookIds.length > 0) {
      where.bookId = bookIds;
    } else {
      where.bookId = null; // No matching books
    }
  }
  if (chapter) {
    where.chapterNum = chapter;
  }

  if (textLike) {
    where.text = { [Op.iLike]: `%${textLike}%` };
  }

  // base query : Verse + Book + MeditativeVerse
  const { rows, count } = await Verse.findAndCountAll({
    where,
    attributes: { exclude: ['bookId'] },
    include: [
      { model: Book, as: 'Book', attributes: ["id", "name", "code", "bibleCode"] },
      { 
        model: MeditativeVerse, 
        as: 'Meditative', 
        attributes: ["id", "commentary", "approved"],
        include: [{ model: Theme, as: "themes" }]
      },
    ],
    order: [["id", "ASC"]],
    distinct: true,
  });

  // filtrage supplémentaire (méditatif/approved) côté JS si besoin
  let items = rows;
  if (isMeditative !== undefined) {
    const meditative = Number(isMeditative) === 1;
    items = items.filter(v => meditative ? v.Meditative != null : v.Meditative == null);
  }

  if (isApproved !== undefined) {
    const approved = Number(isApproved) === 1;
    items = items.filter(v => v.Meditative?.approved === approved);
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
