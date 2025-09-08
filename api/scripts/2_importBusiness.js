const { sequelize, Bible, Testament, Book, Chapter, Verse } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// const taxonomyPath = path.join(__dirname, '../data/taxonomy.json');
// const taxonomy = loadJson(taxonomyPath);

function loadJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }

function getBibleFilePath(bibleCode) {
    return path.join(__dirname, '../data/initial/', `${bibleCode.toLowerCase()}.json`);
}

// Charger les données de la Bible depuis la base de données
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

    const chapters = data.testaments.flatMap(testament => testament.books.flatMap(book => book.chapters.map(chapter => ({
        number: chapter.number,
        bookNumber: book.id,
        testamentIndex: testament.id,
        bibleCode: bible.code,
        versesCount: chapter.verses.length
    }))));

    const verses = data.testaments.flatMap(testament => testament.books.flatMap(book => book.chapters.flatMap(chapter => chapter.verses.map(verse => ({
        number: verse.id,
        text: verse.text,
        chapterNum: chapter.number,
        bookNumber: book.id,
        testamentIndex: testament.id,
        bibleCode: bible.code,
    })))));

    // console.log('Bible data loaded: \nbible', bible, '\ntestaments', testaments, '\nbooks', books.length, '\nchapters', chapters.length, '\nverses', verses.length);
  
    return { bible, testaments, books, chapters, verses };
}

async function saveBible(bibleData) {
    await sequelize.authenticate();
    const [record, created] = await Bible.upsert(bibleData, {
        returning: true
    });

    console.log(record.code, created)
    console.log(`✅ Version ${record.code} ${created ? "créée" : "déjà existante"}`);

    return { record, created };
}

async function saveTestaments(testamentsData) {
    await sequelize.authenticate();
    console.log('saveTestaments authenticated', testamentsData);
    const promises = testamentsData.map(testamentData => {
        return Testament.upsert({
            index: testamentData.index,
            name: testamentData.name,
            bibleCode: testamentData.bibleCode
        }, { returning: true });
    });
    const results = await Promise.all(promises);
    results.forEach(([record, created]) => {
        console.log(record.id, created);
        console.log(`✅ Testament ${record.id} ${created ? "créé" : "déjà existant"}`);
    });
    return results;
}

async function saveBooks(booksData) {
    await sequelize.authenticate();
    const promises = booksData.map(bookData => {
        return Book.upsert(bookData, { returning: true });
    });
    const results = await Promise.all(promises);
    results.forEach(([record, created]) => {
        console.log(record.code, created);
        console.log(`✅ Livre ${record.code} ${created ? "créé" : "déjà existant"}`);
    });
    return results;
}

async function saveChapters(chaptersData) {
    await sequelize.authenticate();
    const promises = chaptersData.map(async chapterData => {
        const testament = await Testament.findOne({
            where: {
                index: chapterData.testamentIndex,
                bibleCode: chapterData.bibleCode
            }
        });
        if (!testament) {
            throw new Error(`Testament not found for index ${chapterData.testamentIndex} and bibleCode ${chapterData.bibleCode}`);
        }
        const book = await Book.findOne({
            where: {
                number: chapterData.bookNumber,
                testamentId: testament.id
            }
        });
        if (!book) {
            throw new Error(`Book not found for number ${chapterData.bookNumber} and testamentId ${testament.id}`);
        }
        return Chapter.upsert({
            number: chapterData.number,
            bookId: book.id,
            versesCount: chapterData.versesCount
        }, { returning: true });
    });
    const results = await Promise.all(promises);
    results.forEach(([record, created]) => {
        console.log(record.id, created);
        console.log(`✅ Chapitre ${record.id} ${created ? "créé" : "déjà existant"}`);
    });
    return results;
}

// Assure-toi d’avoir une contrainte/indice unique côté DB :
// CREATE UNIQUE INDEX IF NOT EXISTS uq_verse_chapter_number ON verses(chapter_id, number);

const BATCH_SIZE = 300;

async function saveVerses(versesData) {
  await sequelize.authenticate();
  console.log('saveVerses authenticated');

  // --- 1) Collecte des clés nécessaires pour limiter les requêtes ---
  const testamentKeys = new Set();
  const bookKeysByTestamentId = new Map(); // testamentKey -> Set(bookNumber)
  const chapterKeysByBookId = new Map();   // bookKey -> Set(chapterNum)

  for (const v of versesData) {
    const tKey = `${v.bibleCode}:${v.testamentIndex}`;
    testamentKeys.add(tKey);
    // On ne connait pas encore testamentId/bookId -> on collectera après mapping
  }

  // --- 2) Charger testaments en une seule fois, puis indexer ---
  const tests = await Testament.findAll({
    attributes: ['id', 'index', 'bibleCode']
  });
  const testamentMap = new Map(); // "bibleCode:index" -> testamentId
  for (const t of tests) testamentMap.set(`${t.bibleCode}:${t.index}`, t.id);

  // On prépare les besoins de livres/chapitres à partir des versets (maintenant qu'on peut résoudre testamentId)
  for (const v of versesData) {
    const tId = testamentMap.get(`${v.bibleCode}:${v.testamentIndex}`);
    if (!tId) throw new Error(`Testament introuvable ${v.bibleCode}:${v.testamentIndex}`);
    if (!bookKeysByTestamentId.has(tId)) bookKeysByTestamentId.set(tId, new Set());
    bookKeysByTestamentId.get(tId).add(v.bookNumber);
  }

  // --- 3) Charger les livres nécessaires (par IN) & indexer ---
  const booksNeeded = [];
  for (const [tId, numbersSet] of bookKeysByTestamentId.entries()) {
    booksNeeded.push({ testamentId: tId, numbers: Array.from(numbersSet) });
  }

  let books = [];
  for (const { testamentId, numbers } of booksNeeded) {
    const rows = await Book.findAll({
      attributes: ['id', 'number', 'testamentId'],
      where: { testamentId, number: { [Op.in]: numbers } }
    });
    books = books.concat(rows);
  }
  const bookMap = new Map(); // "testamentId:bookNumber" -> bookId
  for (const b of books) bookMap.set(`${b.testamentId}:${b.number}`, b.id);

  // Collecte des chapitres à charger
  for (const v of versesData) {
    const bId = bookMap.get(`${testamentMap.get(`${v.bibleCode}:${v.testamentIndex}`)}:${v.bookNumber}`);
    if (!bId) throw new Error(`Book introuvable (${v.bookNumber}) pour ${v.bibleCode}:${v.testamentIndex}`);
    const bKey = String(bId);
    if (!chapterKeysByBookId.has(bKey)) chapterKeysByBookId.set(bKey, new Set());
    chapterKeysByBookId.get(bKey).add(v.chapterNum);
  }

  // --- 4) Charger les chapitres nécessaires & indexer ---
  let chapters = [];
  for (const [bookIdStr, numsSet] of chapterKeysByBookId.entries()) {
    const bookId = Number(bookIdStr);
    const rows = await Chapter.findAll({
      attributes: ['id', 'number', 'bookId'],
      where: { bookId, number: { [Op.in]: Array.from(numsSet) } }
    });
    chapters = chapters.concat(rows);
  }
  const chapterMap = new Map(); // "bookId:chapterNum" -> chapterId
  for (const c of chapters) chapterMap.set(`${c.bookId}:${c.number}`, c.id);

  // --- 5) Traitement en BATCHS pour éviter les timeouts du pool ---
  console.log('saveVerses: starting batches… total=', versesData.length);

  for (let i = 0; i < versesData.length; i += BATCH_SIZE) {
    const slice = versesData.slice(i, i + BATCH_SIZE);

    // On séquence *dans* le batch (évite de spammer le pool Railway)
    await sequelize.transaction(async (t) => {
      for (const v of slice) {
        const tId = testamentMap.get(`${v.bibleCode}:${v.testamentIndex}`);
        const bId = bookMap.get(`${tId}:${v.bookNumber}`);
        const chId = chapterMap.get(`${bId}:${v.chapterNum}`);
        if (!chId) {
          throw new Error(`Chapter introuvable (${v.chapterNum}) — bookId=${bId} (bible=${v.bibleCode}, test=${v.testamentIndex}, book=${v.bookNumber})`);
        }

        // Upsert basé sur l’unicité (chapter_id, number)
        await Verse.upsert(
          {
            chapterId: chId,
            number: v.number,         // = verseNum dans ton dataset
            text: v.text,
            refs: v.refs || [],       // si c’est un ARRAY
          },
          { transaction: t } // PG acceptera upsert si (chapter_id,number) est unique
        );
      }
    });

    console.log(`✅ batch ${i + 1}..${Math.min(i + BATCH_SIZE, versesData.length)} done`);
  }

  console.log('✅ Tous les versets traités.');
}

async function main() {
    console.log('Loading Bible data...', process.argv);
    const [, , bibleCode, taxonomyPath, outPath = './mapping.json'] = process.argv;
    const bibleData = loadBibleData(bibleCode);

    await saveBible(bibleData.bible);
    await saveTestaments(bibleData.testaments);
    await saveBooks(bibleData.books);
    await saveChapters(bibleData.chapters);
    await saveVerses(bibleData.verses);
}

sequelize.sync().then(() => {
    main()
        .then(() => { console.log('✅ Done.'); process.exit(0); })
        .catch((err) => { console.error('❌ Erreur lors de l’import:', err); process.exit(1); });
});
