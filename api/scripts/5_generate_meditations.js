// scripts/generate_meditations.js
/* eslint-disable no-console */

/**
 * Usage:
 *   node scripts/generate_meditations.js
 *
 * ENV (optionnel) :
 *   MIN_SEQUENCE_LENGTH=1            // taille minimale d'un groupe
 *   MAX_VERSES_PER_MEDITATION=3      // taille maximale d'un groupe
 *   BATCH_CHAPTERS=100               // nb de chapitres traités par batch
 */

const {
  sequelize,
  Verse, Chapter,
  Meditation, MeditationVerse,
} = require('../models'); // ajuste le chemin si besoin

const MIN_SEQUENCE_LENGTH       = Number(process.env.MIN_SEQUENCE_LENGTH || 1);
const MAX_VERSES_PER_MEDITATION = Number(process.env.MAX_VERSES_PER_MEDITATION || 3);
const BATCH_CHAPTERS            = Number(process.env.BATCH_CHAPTERS || 100);

// Chapitres qui contiennent des versets avec au moins un thème ET sans lien de méditation
async function getChaptersWithUnmappedVerses() {
  const [rows] = await sequelize.query(`
    SELECT DISTINCT v.chapter_id AS id
    FROM verses v
    JOIN verse_themes vt ON vt.verse_id = v.id
    LEFT JOIN meditation_verses mv ON mv.verse_id = v.id
    WHERE mv.verse_id IS NULL
    ORDER BY v.chapter_id ASC
  `);
  return rows.map(r => r.id);
}

// charge tous les versets d’un chapitre : numéro, thèmes (set), et statut "déjà lié ?"
async function loadChapterVersesWithThemes(chapterId) {
  const [rows] = await sequelize.query(`
    SELECT
      v.id AS verse_id,
      v.number AS verse_number,
      COALESCE(array_agg(DISTINCT vt.theme_id)
               FILTER (WHERE vt.theme_id IS NOT NULL), '{}') AS theme_ids,
      CASE WHEN COUNT(mv.meditation_id) > 0 THEN TRUE ELSE FALSE END AS has_meditation
    FROM verses v
    LEFT JOIN verse_themes vt ON vt.verse_id = v.id
    LEFT JOIN meditation_verses mv ON mv.verse_id = v.id
    WHERE v.chapter_id = :chapterId
    GROUP BY v.id, v.number
    ORDER BY v.number ASC
  `, { replacements: { chapterId } });

  return rows.map(r => ({
    verseId: Number(r.verse_id),
    number: Number(r.verse_number),
    themeIds: (r.theme_ids || []).map(Number).sort((a,b)=>a-b),
    hasMeditation: r.has_meditation === true || r.has_meditation === 't',
  }));
}

function sameThemeSet(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Groupes consécutifs (numéro N, N+1, …), mêmes thèmes EXACTS, taille ≤ MAX
function* groupConsecutiveByIdenticalThemes(verses) {
  let i = 0;
  const n = verses.length;

  while (i < n) {
    const cur = verses[i];

    // on démarre seulement si le verset est libre et possède au moins 1 thème
    if (cur.hasMeditation || cur.themeIds.length === 0) { i += 1; continue; }

    const baseSet = cur.themeIds; // déjà trié
    let group = [cur];
    let j = i + 1;

    while (j < n && group.length < MAX_VERSES_PER_MEDITATION) {
      const prev = verses[j - 1];
      const vj = verses[j];

      // must be strictly consecutive and eligible
      const isConsecutive = vj.number === prev.number + 1;
      if (!isConsecutive || vj.hasMeditation || vj.themeIds.length === 0) break;

      // exact same set of themes
      if (!sameThemeSet(baseSet, vj.themeIds)) break;

      group.push(vj);
      j += 1;
    }

    if (group.length >= MIN_SEQUENCE_LENGTH) {
      yield group;
      i = j; // on saute au prochain après le groupe
    } else {
      i += 1; // sinon on avance d’un
    }
  }
}

async function createMeditationWithLinks(verseIds) {
  // Transaction pour garantir l’atomicité
  return await sequelize.transaction(async (t) => {
    const med = await Meditation.create({
      commentary: null,
      approved: false,
      commentaryUpdatedAt: null,
    }, { transaction: t });

    const links = verseIds.map(vid => ({
      meditation_id: med.id,
      verse_id: vid,
    }));

    // ignoreDuplicates suppose une contrainte unique (tu l’as : uq_meditation_verse)
    const CHUNK = 2000;
    for (let i = 0; i < links.length; i += CHUNK) {
      await MeditationVerse.bulkCreate(links.slice(i, i + CHUNK), {
        ignoreDuplicates: true,
        transaction: t,
      });
    }

    return med.id;
  });
}

async function processChapter(chapterId) {
  const verses = await loadChapterVersesWithThemes(chapterId);
  const groups = Array.from(groupConsecutiveByIdenticalThemes(verses));
  if (!groups.length) return { chapterId, created: 0 };

  let created = 0;
  for (const group of groups) {
    // recheck runtime (concurrence): si certains versets ont été liés entre-temps, on skip
    const stillFree = group.filter(v => !v.hasMeditation);
    if (!stillFree.length) continue;

    // ne crée pas de groupe si, après recheck, il tombe sous le MIN_SEQUENCE_LENGTH
    if (stillFree.length < MIN_SEQUENCE_LENGTH) continue;

    await createMeditationWithLinks(stillFree.map(v => v.verseId));
    created += 1;
  }
  return { chapterId, created };
}

async function main() {
  console.log('🔌 Connecting…');
  await sequelize.authenticate();
  console.log('✅ DB connected');

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

  console.log(`✅ Méditations créées: ${total}`);
  await sequelize.close();
  console.log('👋 Closed DB connection.');
}

main().catch(err => {
  console.error('❌', err?.message);
  process.exit(1);
});
