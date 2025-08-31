// services/books.service.js
const { Book, Chapter, Verse } = require('../models');

// Retourne tous les versets d’un livre (via Chapters → Verses), aplatis
async function getVerses(bookId) {
  const book = await Book.findByPk(bookId, {
    include: [{
      model: Chapter,
      as: 'chapters',
      attributes: ['id', 'number'],
      include: [{ model: Verse, as: 'verses', attributes: ['id', 'number', 'text', 'chapterId'] }],
    }],
    order: [
      [{ model: Chapter, as: 'chapters' }, 'number', 'ASC'],
      [{ model: Chapter, as: 'chapters' }, { model: Verse, as: 'verses' }, 'number', 'ASC'],
    ],
  });

  if (!book) {
    throw new Error(`Book with id '${bookId}' not found`);
  }

  const verses = (book.chapters || []).flatMap(ch => ch.verses || []);
  return verses;
}

// Un verset spécifique d’un livre (en s’assurant qu’il appartient bien au livre)
async function getVerse(bookId, verseId) {
  const verse = await Verse.findOne({
    where: { id: verseId },
    include: [{
      model: Chapter, as: 'chapter', required: true,
      attributes: ['id', 'number', 'bookId'],
      where: { bookId },
    }],
  });

  if (!verse) {
    throw new Error(`Verse with id '${verseId}' not found in book '${bookId}'`);
  }

  return verse;
}

// Tous les versets d’un chapitre (bookId + chapter.number)
async function getChapterVerses(bookId, chapterNum) {
  const chapter = await Chapter.findOne({
    where: { bookId, number: chapterNum },
    attributes: ['id', 'number'],
  });

  if (!chapter) {
    throw new Error(`No verses found for chapter '${chapterNum}' in book '${bookId}'`);
  }

  const verses = await Verse.findAll({
    where: { chapterId: chapter.id },
    attributes: ['id', 'number', 'text', 'chapterId'],
    order: [['number', 'ASC']],
  });

  if (!verses.length) {
    throw new Error(`No verses found for chapter '${chapterNum}' in book '${bookId}'`);
  }

  return verses;
}

// Un verset précis par (bookId, chapterNum, verseNum)
async function getVerseInChapter(bookId, chapterNum, verseNum) {
  const verse = await Verse.findOne({
    where: { number: verseNum },
    include: [{
      model: Chapter, as: 'chapter', required: true,
      attributes: ['id', 'number', 'bookId'],
      where: { bookId, number: chapterNum },
    }],
  });

  if (!verse) {
    throw new Error(`Verse '${chapterNum}:${verseNum}' not found in book '${bookId}'`);
  }

  return verse;
}

// Helpers par code livre (inchangés)
async function getChapterVersesByCode(bookCode, chapterNum) {
  const book = await Book.findOne({ where: { code: bookCode }, attributes: ['id'] });
  if (!book) throw new Error(`Book with code '${bookCode}' not found`);
  return getChapterVerses(book.id, chapterNum);
}

async function getVerseInChapterByCode(bookCode, chapterNum, verseNum) {
  const book = await Book.findOne({ where: { code: bookCode }, attributes: ['id'] });
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
