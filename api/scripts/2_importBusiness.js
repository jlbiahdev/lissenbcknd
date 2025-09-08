const { sequelize, Bible, Testament, Book, Chapter, Verse } = require('../models');
const { Op, literal } = require('sequelize');
const fs = require('fs');
const path = require('path');

function loadJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }

function getBibleFilePath(bibleCode) {
  return path.join(__dirname, '../data/initial/', `${bibleCode.toLowerCase()}.json`);
}

// Charger les données de la Bible depuis le JSON
function loadBibleData(bibleCode) {
  const data = loadJson(getBibleFilePath(bibleCode));

  const bible = {
    code: data.Abbreviation.toUpperCase(),
    name: data.Version,
    language: data.language,
    editionYear: data.editionYear
  };

  const testaments = data.testaments.map(testament => ({
    index: testament.id,
    bibleCode: bible.code,
    name: testament.name,
  }));

  const books = data.testaments.flatMap(testament => testament.books.map(book => ({
    number: book.id,
    code: book.code,
    name: book.name,
    chaptersCount: book.chapters.length,
    testamentId: testament.id,
  })));

  const chapters = data.testaments.flatMap(testament =>
    testament.books.flatMap(book =>
      book.chapters.map(chapter => ({
        number: chapter.number,
        bookNumber: book.id,
        testamentIndex: testament.id,
        bibleCode: bible.code,
        versesCount: chapter.verses.length
      }))
    )
  );

  const verses = data.testaments.flatMap(testament =>
    testament.books.flatMap(book =>
      book.chapters.flatMap(chapter =>
        chapter.verses.map(verse => ({
          number: verse.id,
          text: verse.text,
          chapterNum: chapter.number,
          bookNumber: book.id,
          testamentIndex: testament.id,
          bibleCode: bible.code,
          refs: Array.isArray(verse.refs) ? verse.refs : undefined,
        }))
      )
    )
  );

  return { bible, testaments, books, chapters, verses };
}

async function saveBible(bibleData) {
  await sequelize.authenticate();
  const [record, created] = await Bible.upsert(bibleData, { returning: true });
  console.log(record.code, created);
  console.log(`✅ Version ${record.code} ${created ? "créée" : "déjà existante"}`);
  return { record, created };
}

async function saveTestaments(testamentsData) {
  await sequelize.authenticate();
  console.log('saveTestaments authenticated');
  const promises = testamentsData.map(t =>
    Testament.upsert({ index: t.index, name: t.name, bibleCode: t.bibleCode }, { returning: true })
  );
  const results = await Promise.all(promises);
  results.forEach(([record, created]) => {
    console.log(record.id, created);
    console.log(`✅ Testament ${record.id} ${created ? "créé" : "déjà existant"}`);
  });
  return results;
}

async function saveBooks(booksData) {
  await sequelize.authenticate();
  const results = await Promise.all(booksData.map(b => Book.upsert(b, { returning: true })));
  results.forEach(([record, created]) => {
    console.log(record.code, created);
    console.log(`✅ Livre ${record.code} ${created ? "créé" : "déjà existant"}`);
  });
  return results;
}

async function saveChapters(chaptersData) {
  await sequelize.authenticate();
  const promises = chaptersData.map(async ch => {
    const testament = await Testament.findOne({ where: { index: ch.testamentIndex, bibleCode: ch.bibleCode } });
    if (!testament) throw new Error(`Testament not found for index=${ch.testamentIndex} bibleCode=${ch.bibleCode}`);

    const book = await Book.findOne({ where: { number: ch.bookNumber, testamentId: testament.id } });
    if (!book) throw new Error(`Book not found for number=${ch.bookNumber} testamentId=${testament.id}`);

    return Chapter.upsert({ number: ch.number, bookId: book.id, versesCount: ch.versesCount }, { returning: true });
  });

  const results = await Promise.all(promises);
  results.forEach(([record, created]) => {
    console.log(record.id, created);
    console.log(`✅ Chapitre ${record.id} ${created ? "créé" : "déjà existant"}`);
  });
  return results;
}

// Assure-toi d’avoir en DB : CREATE UNIQUE INDEX IF NOT EXISTS uq_verse_chapter_number ON verses(chapter_id, number);

const BATCH_SIZE = 300;

async function saveVerses(versesData) {
  await sequelize.authenticate();
  console.log('saveVerses authenticated');

  // --- 1) Indexer Testaments en mémoire ---
  const testRows = await Testament.findAll({ attributes: ['id', 'index', 'bibleCode'] });
  const testamentMap = new Map(); // "bibleCode:index" -> testamentId
  for (const t of testRows) testamentMap.set(`${t.bibleCode}:${t.index}`, t.id);

  // --- 2) Collecter livres nécessaires ---
  const bookKeysByTestamentId = new Map(); // testamentId -> Set(bookNumber)
  for (const v of versesData) {
    const tId = testamentMap.get(`${v.bibleCode}:${v.testamentIndex}`);
    if (!tId) throw new Error(`Testament introuvable ${v.bibleCode}:${v.testamentIndex}`);
    if (!bookKeysByTestamentId.has(tId)) bookKeysByTestamentId.set(tId, new Set());
    bookKeysByTestamentId.get(tId).add(v.bookNumber);
  }

  // --- 3) Charger & indexer Livres ---
  let books = [];
  for (const [testamentId, numbersSet] of bookKeysByTestamentId.entries()) {
    const rows = await Book.findAll({
      attributes: ['id', 'number', 'testamentId'],
      where: { testamentId, number: { [Op.in]: Array.from(numbersSet) } }
    });
    books = books.concat(rows);
  }
  const bookMap = new Map(); // "testamentId:bookNumber" -> bookId
  for (const b of books) bookMap.set(`${b.testamentId}:${b.number}`, b.id);

  // --- 4) Collecter chapitres nécessaires ---
  const chapterKeysByBookId = new Map(); // bookId -> Set(chapterNum)
  for (const v of versesData) {
    const tId = testamentMap.get(`${v.bibleCode}:${v.testamentIndex}`);
    const bId = bookMap.get(`${tId}:${v.bookNumber}`);
    if (!bId) throw new Error(`Book introuvable (${v.bookNumber}) pour ${v.bibleCode}:${v.testamentIndex}`);
    if (!chapterKeysByBookId.has(bId)) chapterKeysByBookId.set(bId, new Set());
    chapterKeysByBookId.get(bId).add(v.chapterNum);
  }

  // --- 5) Charger & indexer Chapitres ---
  let chapters = [];
  for (const [bookId, numsSet] of chapterKeysByBookId.entries()) {
    const rows = await Chapter.findAll({
      attributes: ['id', 'number', 'bookId'],
      where: { bookId, number: { [Op.in]: Array.from(numsSet) } }
    });
    chapters = chapters.concat(rows);
  }
  const chapterMap = new Map(); // "bookId:chapterNum" -> chapterId
  for (const c of chapters) chapterMap.set(`${c.bookId}:${c.number}`, c.id);

  // --- 6) Batches + transaction avec SAVEPOINT par insert ---
  console.log('saveVerses: starting batches… total=', versesData.length);

  for (let i = 0; i < versesData.length; i += BATCH_SIZE) {
    const slice = versesData.slice(i, i + BATCH_SIZE);

    await sequelize.transaction(async (t) => {
      for (const v of slice) {
        const tId = testamentMap.get(`${v.bibleCode}:${v.testamentIndex}`);
        const bId = bookMap.get(`${tId}:${v.bookNumber}`);
        const chId = chapterMap.get(`${bId}:${v.chapterNum}`);
        if (!chId) {
          throw new Error(
            `Chapter introuvable (chapter=${v.chapterNum}) — bookId=${bId} (bible=${v.bibleCode}, test=${v.testamentIndex}, book=${v.bookNumber})`
          );
        }

        const safeRefs = Array.isArray(v.refs) && v.refs.length > 0 ? v.refs : null;

        // --- SAVEPOINT isolant chaque INSERT ---
        const sp = await sequelize.transaction({ transaction: t });
        try {
          await Verse.create(
            {
              chapterId: chId,
              number: v.number,
              text: v.text ?? '',
              refs: safeRefs
            },
            { transaction: sp }
          );
          await sp.commit(); // ok pour ce verset
        } catch (err) {
          const isUnique =
            err?.name === 'SequelizeUniqueConstraintError' ||
            err?.parent?.code === '23505';
          // Si doublon : on rollback seulement le SAVEPOINT et on continue (pas d’update)
          await sp.rollback();
          if (!isUnique) {
            // Erreur réelle => casser le batch
            throw err;
          }
          // doublon ignoré
        }
      }
    });

    console.log(`✅ batch ${i + 1}..${Math.min(i + BATCH_SIZE, versesData.length)} done`);
  }

  console.log('✅ Tous les versets traités (insert-only, savepoints).');
}

async function main() {
  console.log('Loading Bible data...', process.argv);
  const [, , bibleCode] = process.argv;
  const bibleData = loadBibleData(bibleCode);

  // await saveBible(bibleData.bible);
  // await saveTestaments(bibleData.testaments);
  // await saveBooks(bibleData.books);
  // await saveChapters(bibleData.chapters);
  await saveVerses(bibleData.verses);
}

sequelize.sync().then(() => {
  main()
    .then(() => { console.log('✅ Done.'); process.exit(0); })
    .catch((err) => { console.error('❌ Erreur lors de l’import:', err); process.exit(1); });
});
