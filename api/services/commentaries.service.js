// services/commentaries.service.js
const {
  sequelize,
  Commentary,        // table commentaries
  CommentaryVerse,   // pivot commentary_verses
  Verse,
  Chapter,
  Book,
} = require('../models');
const { Op } = require('sequelize');
const { formatToExport, formatToView } = require('../helpers/exportFormatter');

// ----------------------- Helpers -----------------------
async function ensureVersesExist(verseIds, t) {
  if (!Array.isArray(verseIds) || verseIds.length === 0) {
    throw new Error("verse_ids must be a non-empty array");
  }
  const verses = await Verse.findAll({
    where: { id: { [Op.in]: verseIds } },
    attributes: ['id', 'chapterId', 'number', 'text'],
    include: [{
      model: Chapter, as: 'chapter',
      attributes: ['id', 'number'],
      include: [{ model: Book, as: 'book', attributes: ['id', 'name', 'code'] }]
    }],
    transaction: t,
  });
  if (verses.length !== verseIds.length) {
    const found = new Set(verses.map(v => v.id));
    const missing = verseIds.filter(id => !found.has(id));
    throw new Error(`Some verse_ids do not exist: [${missing.join(', ')}]`);
  }
  return verses;
}

async function linkCommentaryToVerses(commentaryId, verseIds, t) {
  const rows = verseIds.map(verseId => ({ commentary_id: commentaryId, verse_id: verseId }));
  await CommentaryVerse.bulkCreate(rows, { ignoreDuplicates: true, transaction: t });
}

async function unlinkCommentaryFromVerse(commentaryId, verseId, t) {
  await CommentaryVerse.destroy({
    where: { commentary_id: commentaryId, verse_id: verseId },
    transaction: t,
  });
  const remain = await CommentaryVerse.count({
    where: { commentary_id: commentaryId },
    transaction: t,
  });
  if (remain === 0) {
    await Commentary.destroy({ where: { id: commentaryId }, transaction: t });
  }
}

function toExportShape(commentary, verses) {
  // shape attendu par formatToExport (compat ancien “Meditation”)
  return {
    id: commentary.id,
    approved: commentary.approved,
    commentary: commentary.text ?? null,
    commentaryUpdatedAt: commentary.commentaryUpdatedAt ?? null,
    verses, // Verse avec include Chapter->Book
  };
}

// ------------------------- API -------------------------

/**
 * Crée un commentaire (title par défaut) et le lie à une liste de versets.
 * @param {string} bookCode  - optionnel, sert pour le titre par défaut
 * @param {number[]} verse_ids
 */
async function insert(bookCode, verse_ids) {
  return sequelize.transaction(async (t) => {
    await ensureVersesExist(verse_ids, t);

    const title = bookCode ? `Commentaire ${bookCode}` : 'Commentaire';
    const commentary = await Commentary.create({
      title,
      text: null,
      approved: false,
      commentaryUpdatedAt: null,
    }, { transaction: t });

    await linkCommentaryToVerses(commentary.id, verse_ids, t);
    return commentary;
  });
}

/**
 * Supprime un commentaire (cascade supprime les liens).
 */
async function remove(id) {
  return sequelize.transaction(async (t) => {
    const c = await Commentary.findByPk(id, { transaction: t });
    if (!c) throw new Error('Commentary not found');
    await Commentary.destroy({ where: { id }, transaction: t });
    return { success: true };
  });
}

/**
 * Bascule approved du commentaire (par ID de commentaire).
 * @param {number} id - commentary id
 */
async function toggleApproval(id) {
  return sequelize.transaction(async (t) => {
    const c = await Commentary.findByPk(id, { transaction: t });
    if (!c) throw new Error('Commentary not found');
    c.approved = !c.approved;
    await c.save({ transaction: t });
    return c;
  });
}

/**
 * Met à jour le contenu d’un commentaire, reset approved=false et date de MAJ.
 * @param {number} id
 * @param {string|null} text
 */
async function update(id, text) {
  return sequelize.transaction(async (t) => {
    const c = await Commentary.findByPk(id, { transaction: t });
    if (!c) throw new Error('Commentary not found');
    c.text = text ?? null;
    c.approved = false;
    c.commentaryUpdatedAt = new Date();
    await c.save({ transaction: t });
    return c;
  });
}

/**
 * Lie un verset au commentaire (idempotent).
 * @param {number} id - commentary id
 * @param {number} verseId
 */
async function addVerse(id, verseId) {
  return sequelize.transaction(async (t) => {
    const c = await Commentary.findByPk(id, { transaction: t });
    if (!c) throw new Error('Commentary not found');
    await ensureVersesExist([verseId], t);

    await CommentaryVerse.findOrCreate({
      where: { commentary_id: id, verse_id: verseId },
      defaults: { commentary_id: id, verse_id: verseId },
      transaction: t,
    });

    return c;
  });
}

/**
 * Délie un verset du commentaire ; supprime le commentaire s’il n’a plus de versets.
 * @param {number} id - commentary id
 * @param {number} verseId
 */
async function removeVerse(id, verseId) {
  return sequelize.transaction(async (t) => {
    const c = await Commentary.findByPk(id, { transaction: t });
    if (!c) throw new Error('Commentary not found');
    await unlinkCommentaryFromVerse(id, verseId, t);
    return { success: true };
  });
}

/**
 * Exporte un commentaire (par id) avec ses versets (Chapter->Book inclus),
 * transformé au format attendu par formatToExport.
 */
async function exports(id) {
  const c = await Commentary.findByPk(id);
  if (!c) throw new Error('Commentary not found');

  const verses = await Verse.findAll({
    include: [{
      model: Commentary,
      as: 'commentaries',
      where: { id },
      attributes: [],
      through: { attributes: [] },
      required: true,
    }, {
      model: Chapter, as: 'chapter',
      include: [{ model: Book, as: 'book' }]
    }],
    order: [['id', 'ASC']],
  });

  const shaped = toExportShape(c, verses);
  return formatToExport([shaped]);
}

/**
 * Liste des commentaires, avec leurs versets (pour affichage).
 * Retourne un tableau formaté via formatToView.
 */
async function get() {
  const rows = await Commentary.findAll({
    include: [{
      model: Verse,
      as: 'verses',
      through: { attributes: [] },
      include: [{
        model: Chapter, as: 'chapter',
        include: [{ model: Book, as: 'book' }]
      }]
    }],
    order: [['id', 'ASC']],
  });

//   rows.map(r => r.toJSON()).forEach(r => console.log('Retrieved commentary:', r));
  const adapted = rows.map(c => ({
    id: c.id,
    title: c.title,
    text: c.text ?? null,
    approved: c.approved,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt ?? null,
    verses: c.verses,
  }));

//   console.log('Adapted commentaries:', adapted);

  const result = adapted.map(formatToView);

  return result;
}

/**
 * Détail d’un commentaire par id (avec versets).
 */
async function getById(id) {
  const c = await Commentary.findByPk(id, {
    include: [{
      model: Verse,
      as: 'verses',
      through: { attributes: [] },
      include: [{
        model: Chapter, as: 'chapter',
        include: [{ model: Book, as: 'book' }]
      }]
    }],
  });
  if (!c) throw new Error('Commentary not found');

  const adapted = {
    id: c.id,
    title: c.title,
    text: c.text ?? null,
    approved: c.approved,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt ?? null,
    verses: c.verses,
  };

  return formatToView(adapted);
}

/**
 * Filtre par (bookName like), (chapterNum), (verseNum).
 */
async function filter(bookName, chapterNum, verseNum) {
  const verseWhere = {};
  if (Number.isFinite(verseNum)) verseWhere.number = verseNum;

  console.log('Filter params:', { bookName, chapterNum, verseNum, verseWhere });
  
  const chapterWhere = {};
  if (Number.isFinite(chapterNum)) chapterWhere.number = chapterNum;

  const bookWhere = {};
  if (bookName) bookWhere.name = { [Op.iLike]: `%${bookName}%` };

  const rows = await Commentary.findAll({
    include: [{
      model: Verse,
      as: 'verses',
      required: true,
      where: Object.keys(verseWhere).length ? verseWhere : undefined,
      through: { attributes: [] },
      include: [{
        model: Chapter, as: 'chapter',
        required: true,
        where: Object.keys(chapterWhere).length ? chapterWhere : undefined,
        include: [{
          model: Book, as: 'book',
          required: Object.keys(bookWhere).length > 0,
          where: Object.keys(bookWhere).length ? bookWhere : undefined,
        }]
      }]
    }],
    order: [['id', 'ASC']],
  });

  const adapted = rows.map(c => ({
    id: c.id,
    title: c.title,
    text: c.text ?? null,
    approved: c.approved,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt ?? null,
    verses: c.verses,
  }));

  console.log('Adapted commentaries for view:', adapted);
  return adapted.map(formatToView);
}

module.exports = {
  insert,
  toggleApproval,
  update,
  addVerse,
  remove,
  removeVerse,
  exports,
  get,
  getById,
  filter
};
