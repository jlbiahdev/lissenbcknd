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
async function getVerses(bibleCode, bookNameLike, chapter, textLike, isMeditative, isApproved) {
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
    // Méditations liées (via pivot)
    {
      model: Meditation,
      as: 'meditations',
      attributes: ['id', 'commentary', 'approved', 'commentaryUpdatedAt'],
      through: { attributes: [] },
      required: false,
    },
  ];

  const { rows } = await Verse.findAndCountAll({
    where: verseWhere,
    attributes: ['id', 'number', 'text', 'chapterId'],
    include,
    order: [['id', 'ASC']],
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

    // Méditation unique (0..1) comme avant
    const firstMed = Array.isArray(j.meditations) && j.meditations.length > 0 ? j.meditations[0] : null;

    // Les thèmes étaient exposés sous "Meditative.themes" dans l’ancien payload :
    // on les dérive depuis le verset (via verse_themes)
    const verseThemes = Array.isArray(j.themes)
      ? j.themes.map(t => ({ id: t.id, name: t.name, categoryId: t.categoryId }))
      : [];

    const Meditative = firstMed ? {
      id: firstMed.id,
      commentary: firstMed.commentary,
      approved: firstMed.approved,
      themes: verseThemes,
    } : null;

    // Payload final (plat), sans branches internes
    return {
      id: j.id,
      number: j.number,
      text: j.text,
      chapterId: j.chapterId,
      Book: BookFlat,
      Bible: bible ? {
        code: bible.code,
        name: bible.name,
        language: bible.language,
        editionYear: bible.editionYear,
      } : null,
      Meditative,
    };
  });

  // Filtres JS identiques à l’ancien service
  if (isMeditative !== undefined) {
    const meditative = Number(isMeditative) === 1;
    items = items.filter(v => (meditative ? v.Meditative != null : v.Meditative == null));
  }
  if (isApproved !== undefined) {
    const approved = Number(isApproved) === 1;
    items = items.filter(v => v.Meditative?.approved === approved);
  }

  return items;
}

module.exports = {
  getBooks,
  getBook,
  getVerses,
};
