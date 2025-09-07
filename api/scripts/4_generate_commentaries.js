// scripts/generate_commentaries.js
/* eslint-disable no-console */

/**
 * Usage:
 *   node scripts/generate_commentaries.js
 *   node scripts/generate_commentaries.js --book=GEN   // ne traite que le livre CODE=GEN
 *
 * ENV:
 *   BOOK_CODE=GEN
 *   MIN_SEQUENCE_LENGTH=1
 *   MAX_VERSES_PER_COMMENTARY=3
 *   BATCH_CHAPTERS=20
 */

const {
  sequelize,
  Verse, Chapter,
  Commentary, CommentaryVerse,
} = require('../models');

// --------------------- Params ---------------------
const MIN_SEQUENCE_LENGTH       = Number(process.env.MIN_SEQUENCE_LENGTH || 1);
const MAX_VERSES_PER_COMMENTARY = Number(process.env.MAX_VERSES_PER_COMMENTARY || 3);
const BATCH_CHAPTERS            = Number(process.env.BATCH_CHAPTERS || 20);

// parse --book=CODE (ou env BOOK_CODE)
function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find(a => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}
const ONLY_BOOK_CODE = parseArg('book') || process.env.BOOK_CODE || undefined;

// --------------------- Retry helpers ---------------------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, { tries = 3, baseDelay = 500 } = {}) {
  let lastErr;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || '');
      const transient =
        msg.includes('Connection terminated unexpectedly') ||
        msg.includes('SequelizeConnectionAcquireTimeoutError') ||
        msg.includes('ECONNRESET') ||
        msg.includes('socket hang up');
      if (!transient || i === tries) throw err;

      console.warn(`⚠️ tentative ${i} échouée, retry… (${msg})`);
      await sleep(baseDelay * i);
      try { await sequelize.authenticate(); } catch {}
    }
  }
  throw lastErr;
}

// --------------------- SQL helpers ---------------------

// IMPORTANT : pas de JOIN sur verse_themes ici ; on veut tous les chapitres qui ont
// au moins un verset non encore lié. Filtre optionnel par code de livre.
async function getChaptersWithUnmappedVerses() {
  const sql = `
    SELECT DISTINCT v.chapter_id AS id
    FROM verses v
    JOIN chapters c ON c.id = v.chapter_id
    JOIN books b    ON b.id = c.book_id
    LEFT JOIN commentary_verses cv ON cv.verse_id = v.id
    WHERE cv.verse_id IS NULL
    ${ONLY_BOOK_CODE ? 'AND b.code = :bookCode' : ''}
    ORDER BY v.chapter_id ASC
  `;
  const [rows] = await sequelize.query(sql, {
    replacements: ONLY_BOOK_CODE ? { bookCode: ONLY_BOOK_CODE } : undefined,
  });
  return rows.map(r => r.id);
}

// Versets d’un chapitre + thèmes + statut « déjà lié »
async function loadChapterVersesWithThemes(chapterId) {
  const [rows] = await sequelize.query(`
    SELECT
      v.id AS verse_id,
      v.number AS verse_number,
      COALESCE(array_agg(DISTINCT vt.theme_id)
               FILTER (WHERE vt.theme_id IS NOT NULL), '{}') AS theme_ids,
      CASE WHEN COUNT(cv.commentary_id) > 0 THEN TRUE ELSE FALSE END AS has_commentary
    FROM verses v
    LEFT JOIN verse_themes vt      ON vt.verse_id = v.id
    LEFT JOIN commentary_verses cv ON cv.verse_id = v.id
    WHERE v.chapter_id = :chapterId
    GROUP BY v.id, v.number
    ORDER BY v.number ASC
  `, { replacements: { chapterId } });

  return rows.map(r => ({
    verseId: Number(r.verse_id),
    number: Number(r.verse_number),
    themeIds: (r.theme_ids || []).map(Number).sort((a, b) => a - b),
    hasCommentary: r.has_commentary === true || r.has_commentary === 't',
  }));
}

// Métadonnées pour construire le titre "Livre Chapitre:range"
async function getChapterMeta(chapterId) {
  const [rows] = await sequelize.query(`
    SELECT b.name AS book_name, c.number AS chapter_number
    FROM chapters c
    JOIN books b ON b.id = c.book_id
    WHERE c.id = :chapterId
    LIMIT 1
  `, { replacements: { chapterId } });

  if (!rows || rows.length === 0) throw new Error(`Chapter not found: ${chapterId}`);
  return { bookName: rows[0].book_name, chapterNumber: Number(rows[0].chapter_number) };
}

// --------------------- Grouping logic ---------------------
function sameThemeSet(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Groupes consécutifs (N, N+1, …) avec set de thèmes EXACT identique
function* groupConsecutiveByIdenticalThemes(verses) {
  let i = 0;
  const n = verses.length;
  while (i < n) {
    const cur = verses[i];
    if (cur.hasCommentary || cur.themeIds.length === 0) { i += 1; continue; }

    const baseSet = cur.themeIds;
    let group = [cur];
    let j = i + 1;

    while (j < n && group.length < MAX_VERSES_PER_COMMENTARY) {
      const prev = verses[j - 1];
      const vj = verses[j];
      const isConsecutive = vj.number === prev.number + 1;
      if (!isConsecutive || vj.hasCommentary || vj.themeIds.length === 0) break;
      if (!sameThemeSet(baseSet, vj.themeIds)) break;
      group.push(vj);
      j += 1;
    }

    if (group.length >= MIN_SEQUENCE_LENGTH) { yield group; i = j; }
    else { i += 1; }
  }
}

// --------------------- Creation ---------------------
async function createCommentaryWithLinks({ title, verseIds }) {
  return withRetry(async () => {
    return sequelize.transaction(async (t) => {
      const comm = await Commentary.create({
        title,
        text: null,
        approved: false,
        commentaryUpdatedAt: null,
      }, { transaction: t });

      const links = verseIds.map(vid => ({ commentary_id: comm.id, verse_id: vid }));

      const CHUNK = 500;
      for (let i = 0; i < links.length; i += CHUNK) {
        await CommentaryVerse.bulkCreate(links.slice(i, i + CHUNK), {
          ignoreDuplicates: true,
          transaction: t,
        });
      }
      return comm.id;
    });
  }, { tries: 3, baseDelay: 800 });
}

// --------------------- Processing ---------------------
async function processChapter(chapterId) {
  console.log(`→ chapter ${chapterId}`);
  const verses = await loadChapterVersesWithThemes(chapterId);
  const groups = Array.from(groupConsecutiveByIdenticalThemes(verses));
  if (!groups.length) { console.log('  0 group'); return { chapterId, created: 0 }; }

  const { bookName, chapterNumber } = await getChapterMeta(chapterId);
  let created = 0;

  for (const group of groups) {
    const stillFree = group.filter(v => !v.hasCommentary);
    if (stillFree.length < MIN_SEQUENCE_LENGTH) continue;

    const first = stillFree[0].number;
    const last  = stillFree[stillFree.length - 1].number;
    const title = `${bookName} ${chapterNumber}:${first === last ? first : `${first}-${last}`}`;

    console.log(`  + create "${title}" (${stillFree.length} verses)`);
    await createCommentaryWithLinks({ title, verseIds: stillFree.map(v => v.verseId) });
    created += 1;
  }
  return { chapterId, created };
}

// --------------------- Main ---------------------
async function main() {
  console.log('🔌 Connecting…');
  await sequelize.authenticate();
  console.log('✅ DB connected');

  if (ONLY_BOOK_CODE) {
    console.log(`📕 Mode « un seul livre » : ${ONLY_BOOK_CODE}`);
  }

  const chapterIds = await getChaptersWithUnmappedVerses();
  if (!chapterIds.length) {
    console.log('ℹ️ Aucun chapitre à traiter.');
    await sequelize.close();
    console.log('👋 Closed DB connection.');
    return;
  }

  console.log(`📖 Chapitres à traiter: ${chapterIds.length}`);
  let total = 0;

  for (let i = 0; i < chapterIds.length; i += BATCH_CHAPTERS) {
    const slice = chapterIds.slice(i, i + BATCH_CHAPTERS);
    console.log(`➡️ Batch chapitres ${i + 1}..${i + slice.length}`);
    for (const chapterId of slice) {
      const { created } = await processChapter(chapterId);
      total += created;
    }
  }

  console.log(`✅ Commentaires créés: ${total}`);
  await sequelize.close();
  console.log('👋 Closed DB connection.');
}

main().catch(err => {
  console.error('❌', err?.message);
  process.exit(1);
});
