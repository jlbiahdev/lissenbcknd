// scripts/generate_verse_themes.js
/* eslint-disable no-console */

/**
 * Usage:
 *   node scripts/generate_verse_themes.js
 *
 * ENV (facultatif) :
 *   MAX_THEMES_PER_VERSE=3
 *   THEME_MIN_SCORE=1
 *   CATEGORY_BOOST=1
 *   BATCH_SIZE=2000
 */

const {
  sequelize,
  Verse, Chapter, Book,
  CategoryTheme, Theme,
  VerseTheme,
} = require('../models');

const MAX_THEMES_PER_VERSE = Number(process.env.MAX_THEMES_PER_VERSE || 3);
const THEME_MIN_SCORE      = Number(process.env.THEME_MIN_SCORE || 1);
const CATEGORY_BOOST       = Number(process.env.CATEGORY_BOOST || 1);
const BATCH_SIZE           = Number(process.env.BATCH_SIZE || 2000);

function normalizeFr(s = '') {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function scoreText(text, keywords) {
  if (!keywords || !keywords.length) return 0;
  const base = normalizeFr(text);
  let score = 0;
  for (const kw of keywords) {
    const needle = normalizeFr(kw);
    if (!needle) continue;
    if (base.includes(needle)) score += 1;
  }
  return score;
}

async function fetchTaxonomy() {
  const categories = await CategoryTheme.findAll({
    attributes: ['id', 'keywords'],
    raw: true,
  });
  const themes = await Theme.findAll({
    attributes: ['id', 'categoryId', 'keywords'],
    raw: true,
  });

  const catById = new Map(categories.map(c => [Number(c.id), c]));
  return { categories, themes, catById };
}

function pickTopThemesForText(text, taxonomy) {
  // 1) score catégories
  const catScores = [];
  for (const c of taxonomy.categories) {
    const s = scoreText(text, c.keywords);
    if (s) catScores.push({ id: Number(c.id), score: s });
  }
  catScores.sort((a, b) => b.score - a.score);

  // 2) score thèmes + bonus catégorie
  const themeScores = [];
  for (const t of taxonomy.themes) {
    let s = scoreText(text, t.keywords);
    if (s && CATEGORY_BOOST) {
      const bonus = catScores.find(cs => cs.id === Number(t.categoryId))?.score || 0;
      s += bonus * CATEGORY_BOOST;
    }
    if (s >= THEME_MIN_SCORE) {
      themeScores.push({ id: Number(t.id), score: s });
    }
  }

  themeScores.sort((a, b) => b.score - a.score);

  return themeScores.slice(0, MAX_THEMES_PER_VERSE).map(x => x.id);
}

async function* iterateVerses() {
  let offset = 0;
  while (true) {
    const verses = await Verse.findAll({
      attributes: ['id', 'text', 'number', 'chapterId'],
      include: [{
        model: Chapter, as: 'chapter', attributes: ['id', 'number', 'bookId'],
        include: [{ model: Book, as: 'book', attributes: ['id', 'code', 'name'] }]
      }],
      order: [['id', 'ASC']],
      limit: BATCH_SIZE,
      offset,
    });
    if (!verses.length) break;
    for (const v of verses) {
      yield {
        verseId: Number(v.id),
        text: v.text || '',
        bookCode: v.chapter?.book?.code || v.chapter?.book?.name || '',
        chapterNumber: Number(v.chapter?.number || 0),
        verseNumber: Number(v.number || 0),
      };
    }
    offset += verses.length;
  }
}

async function main() {
  console.log('🔌 DB connect…');
  await sequelize.authenticate();
  console.log('✅ DB connected');

  const taxonomy = await fetchTaxonomy();
  const rowsToInsert = [];

  console.time('⏱ scoring');
  for await (const v of iterateVerses()) {
    const themeIds = pickTopThemesForText(v.text, taxonomy);
    for (const tid of themeIds) {
      rowsToInsert.push({ verse_id: v.verseId, theme_id: tid });
    }
  }

  console.timeEnd('⏱ scoring');

  if (!rowsToInsert.length) {
    console.log('ℹ️ Aucun thème détecté. Rien à insérer.');
    await sequelize.close();
    return;
  }

  console.log(`➕ Insertion verse_themes (rows: ${rowsToInsert.length})…`);

  const CHUNK = 5000;
  for (let i = 0; i < rowsToInsert.length; i += CHUNK) {
    const slice = rowsToInsert.slice(i, i + CHUNK);
    await VerseTheme.bulkCreate(slice, { ignoreDuplicates: true });
    console.log(`   ${Math.min(i + CHUNK, rowsToInsert.length)}/${rowsToInsert.length}`);
  }
  
  console.log('✅ verse_themes alimenté (idempotent via PK composite).');

  await sequelize.close();
  console.log('👋 Closed DB connection.');
}

main().catch(err => {
  console.error('❌', err?.message);
  process.exit(1);
});
