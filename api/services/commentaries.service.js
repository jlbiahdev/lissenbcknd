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

// Utilisé pour garder le payload attendu par l'UI (row.commentary / row.verses)
function toViewRow(c) {
  return {
    commentary: {
      id: c.id,
      title: c.title,
      text: c.text ?? null,
      approved: !!c.approved,
      updatedAt: c.updatedAt ?? c.updated_at ?? null,
    },
    verses: (c.verses || []).map(v => ({
      id: v.id,
      number: v.number,
      chapter: {
        id: v.chapter?.id ?? null,
        number: v.chapter?.number ?? null,
        book: {
          id: v.chapter?.book?.id ?? null,
          code: v.chapter?.book?.code ?? "",
          name: v.chapter?.book?.name ?? "",
        },
      },
    })),
  };
}

function toPosInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

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
  return {
    id: commentary.id,
    approved: commentary.approved,
    commentary: commentary.text ?? null,
    updatedAt: commentary.updatedAt ?? null,
    verses, // Verse avec include Chapter->Book
  };
}

// --- helpers de validation & titre ---

function assertSameBookChapterContiguous(verses) {
  if (!verses.length) throw new Error("verseIds cannot be empty");

  // même livre + même chapitre
  const bookId = verses[0].chapter.book.id;
  const chapNo = verses[0].chapter.number;
  for (const v of verses) {
    if (v.chapter.book.id !== bookId) {
      throw new Error("All verseIds must belong to the same book");
    }
    if (v.chapter.number !== chapNo) {
      throw new Error("All verseIds must belong to the same chapter");
    }
  }

  // contiguïté (par numéros)
  const nums = verses.map(v => v.number).sort((a,b)=>a-b);
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i-1] + 1) {
      throw new Error("verseIds must form a contiguous sequence");
    }
  }
}

function computeTitleFromVerses(verses) {
  if (!verses?.length) return "";
  // on suppose même livre + chapitre (déjà validé)
  const bookName = verses[0].chapter.book.name || "";
  const ch = verses[0].chapter.number;
  const nums = verses.map(v => v.number).sort((a,b)=>a-b);
  const first = nums[0];
  const last  = nums[nums.length - 1];
  const suffix = (first === last) ? `${first}` : `${first}-${last}`;
  return `${bookName} ${ch}:${suffix}`;
}

// ------------------------- API -------------------------

/**
 * Crée un commentaire (title par défaut) et le lie à une liste de versets.
 * @param {string} bookCode  - optionnel, sert pour le titre par défaut
 * @param {number[]} verse_ids
 */
async function add(bookCode, verse_ids) {
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

async function update(id, { text, verseIds }) {
  return sequelize.transaction(async (t) => {
    const c = await Commentary.findByPk(id, { transaction: t });
    if (!c) throw new Error('Commentary not found');

    let somethingChanged = false;
    let newVerses = null;

    // 1) Si verseIds fourni → remplacement intégral après validation LISSEN
    if (Array.isArray(verseIds)) {
      const uniqIds = Array.from(new Set(verseIds.map(Number).filter(n => Number.isInteger(n) && n > 0)));
      if (uniqIds.length === 0) throw new Error("verseIds must be a non-empty array of integers");

      const verses = await ensureVersesExist(uniqIds, t);
      // include Book/Chapter déjà dans ensureVersesExist
      assertSameBookChapterContiguous(verses);

      // remplace tous les liens
      await CommentaryVerse.destroy({ where: { commentary_id: id }, transaction: t });
      await linkCommentaryToVerses(id, uniqIds, t);

      // titre recalculé (bookName)
      const title = computeTitleFromVerses(verses);
      c.title = title;
      somethingChanged = true;
      newVerses = verses;
    }

    // 2) Texte
    if (typeof text === 'string' && text !== c.text) {
      c.text = text;
      somethingChanged = true;
    }

    // 3) approved
    if (somethingChanged) {
      c.approved = false;
    }

    await c.save({ transaction: t });

    // 4) Recharger pour réponse complète
    const full = await Commentary.findByPk(c.id, {
      transaction: t,
      include: [{
        model: Verse, as: 'verses',
        through: { attributes: [] },
        include: [{ model: Chapter, as: 'chapter', include: [{ model: Book, as: 'book' }] }],
        order: [['number','ASC']]
      }]
    });

    return {
      id: full.id,
      title: full.title,
      text: full.text ?? null,
      approved: !!full.approved,
      updatedAt: full.updatedAt ?? full.updated_at ?? null,
      verses: full.verses,
    };
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
 * Liste des commentaires avec filtres:
 * - bookCode (exact) OU bookName (ILIKE %…%)
 * - chapterNum
 * - verseNum
 * - approved = 0|1
 */
async function get({ bookName, bookCode, chapterNum, verseNum, approved }) {
  const verseWhere = {};
  const chapterWhere = {};
  const bookWhere = {};
  const commentaryWhere = {};

  const cNum = toPosInt(chapterNum);
  const vNum = toPosInt(verseNum);

  if (typeof approved !== 'undefined' && approved !== '') {
    const flag = String(approved) === '1';
    commentaryWhere.approved = flag;
  }
  if (cNum !== undefined) chapterWhere.number = cNum;
  if (vNum !== undefined) verseWhere.number = vNum;

  const bn = (bookName ?? '').trim();
  const bc = (bookCode ?? '').trim();
  if (bc) {
    bookWhere.code = bc; // match exact sur code
  } else if (bn) {
    bookWhere.name = { [Op.iLike]: `%${bn}%` }; // ILIKE sur nom
  }

  const rows = await Commentary.findAll({
    where: Object.keys(commentaryWhere).length ? commentaryWhere : undefined,
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
        }],
      }],
    }],
    order: [
      ['id', 'ASC'],
      [{ model: Verse, as: 'verses' }, 'id', 'ASC'],
    ],
    distinct: true,
  });

  return rows.map(toViewRow);
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

async function toggleApproval(id) {
  const c = await Commentary.findByPk(id);
  if (!c) throw new Error('Commentary not found');
  c.approved = !c.approved;
  await c.save();
  return { id: c.id, approved: c.approved };
}

module.exports = {
  add,
  update,
  remove,
  exports,
  toggleApproval,
  get,
  getById,
};
