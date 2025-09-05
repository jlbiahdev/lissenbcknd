// services/bibles.service.js
const { Op } = require('sequelize');
const {
  Bible,
  Testament,
  Book,
  Chapter,
  Verse,
  Theme,
  Meditation,
} = require('../models');

// ---------------------- getBooks ----------------------
async function getBooks(bibleCode) {
  const bible = await Bible.findOne({
    where: { code: bibleCode },
    include: [{
      model: Testament, as: 'testaments',
      include: [{ model: Book, as: 'books' }],
      required: false,
    }],
  });

  if (!bible) {
    throw new Error(`Bible with code '${bibleCode}' not found`);
  }

  // Payload attendu : tableau de Book (comme avant)
  const books = (bible.testaments || []).flatMap(t => t.books || []);
  return books;
}

// ---------------------- getBook -----------------------
async function getBook(bibleCode, bookId) {
  // Cherche le Book par id, en s'assurant qu'il appartient à la Bible 'bibleCode'
  const book = await Book.findOne({
    where: { id: bookId },
    include: [{
      model: Testament, as: 'testament', required: true,
      include: [{ model: Bible, as: 'bible', where: { code: bibleCode }, required: true }],
    }],
  });

  if (!book) {
    throw new Error(`Book with id '${bookId}' not found in bible '${bibleCode}'`);
  }

  return book;
}

// ---------------------- getVerses ---------------------
async function getVerses(bibleCode, bookNameLike, chapter, textLike) {
  const verseWhere = {};
  if (textLike) verseWhere.text = { [Op.iLike]: `%${textLike}%` };

  // Construit les includes imbriqués pour filtrer par bible / livre / chapitre
  const include = [
    {
      model: Chapter,
      as: 'chapter',
      attributes: ['id', 'number'],
      required: true,
      where: chapter ? { number: chapter } : undefined,
      include: [{
        model: Book,
        as: 'book',
        attributes: ['id', 'name', 'code'],
        required: true,
        where: bookNameLike ? { name: { [Op.iLike]: `%${bookNameLike}%` } } : undefined,
        include: [{
          model: Testament,
          as: 'testament',
          attributes: ['id'],
          required: true,
          include: [{
            model: Bible,
            as: 'bible',
            attributes: ['code', 'name', 'language', 'editionYear'],
            required: true,
            where: bibleCode ? { code: bibleCode } : undefined,
          }],
        }],
      }],
    },
    // Thèmes du verset (via pivot)
    {
      model: Theme,
      as: 'themes',
      attributes: ['id', 'name', 'categoryId'],
      through: { attributes: [] },
      required: false,
    },
  ];

  const { rows } = await Verse.findAndCountAll({
    where: verseWhere,
    attributes: ['id', 'number', 'text', 'chapterId'],
    include,
    order: [['chapterId', 'ASC'], ['number', 'ASC']],
    distinct: true, // évite les doublons avec belongsToMany
  });

  // Post-traitement pour restituer le payload HISTORIQUE (plat)
  let items = rows.map(v => {
    const j = v.toJSON();

    const book = j.chapter?.book || null;
    const bible = j.chapter?.book?.testament?.bible || null;

    // Book attendu : { id, name, code, bibleCode }
    const BookFlat = book ? {
      id: book.id,
      name: book.name,
      code: book.code,
      bibleCode: bible?.code || null,
    } : null;

    // Payload final (plat), sans branches internes
    // console.log('j', j)
    return {
      id: j.id,
      number: j.number,
      text: j.text,
      chapterNumber: j.chapter.number,
      Book: BookFlat,
      Bible: bible ? {
        code: bible.code,
        name: bible.name,
        language: bible.language,
        editionYear: bible.editionYear,
      } : null,
      // Meditative,
    };
  });

  return items;
}

module.exports = {
  getBooks,
  getBook,
  getVerses,
};
