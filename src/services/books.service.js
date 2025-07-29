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

async function getChapterVerses(bookId, chapterNum) {
  const verses = await Verse.findAll({
    where: {
      bookId,
      chapterNum,
    },
    order: [['verseNum', 'ASC']],
  });

  if (!verses.length) {
    throw new Error(`No verses found for chapter '${chapterNum}' in book '${bookId}'`);
  }

  return verses;
}

async function getVerseInChapter(bookId, chapterNum, verseNum) {
  const verse = await Verse.findOne({
    where: {
      bookId,
      chapterNum,
      verseNum,
    },
  });

  if (!verse) {
    throw new Error(`Verse '${chapterNum}:${verseNum}' not found in book '${bookId}'`);
  }

  return verse;
}

async function getChapterVersesByCode(bookCode, chapterNum) {
  const book = await Book.findOne({ where: { code: bookCode } });
  if (!book) throw new Error(`Book with code '${bookCode}' not found`);
  return getChapterVerses(book.id, chapterNum);
}

async function getVerseInChapterByCode(bookCode, chapterNum, verseNum) {
  const book = await Book.findOne({ where: { code: bookCode } });
  if (!book) throw new Error(`Book with code '${bookCode}' not found`);
  return getVerseInChapter(book.id, chapterNum, verseNum);
}

module.exports = {
  getVerses,
  getVerse,
  getChapterVerses,
  getChapterVersesByCode,
  getVerseInChapter,
  getVerseInChapterByCode,
};
