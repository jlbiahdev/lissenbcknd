const { sequelize, Bible, Testament, Book, Chapter } = require('../models');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const biblePath = path.join(__dirname, '../data/initial/lsg1910.json');
// const taxonomyPath = path.join(__dirname, '../data/taxonomy.json');

// const taxonomy = loadJson(taxonomyPath);

function loadJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }

function getBibleFilePath(bibleCode) {
    return path.join(__dirname, '../data/initial/', `${bibleCode.toLowerCase()}.json`);
}

function loadBibleData(bibleCode) {
    // Charger les données de la Bible depuis la base de données
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
        id: verse.id,
        text: verse.text,
        ref: verse.ref,
    })))));

    console.log('Bible data loaded: \nbible', bible, '\ntestaments', testaments, '\nbooks', books.length, '\nchapters', chapters.length, '\nverses', verses.length);
  
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

async function main() {
    console.log('Loading Bible data...', process.argv);
    const [, , bibleCode, taxonomyPath, outPath = './mapping.json'] = process.argv;
    const bibleData = loadBibleData(bibleCode);
    console.log('Bible data loaded successfully');

    await saveBible(bibleData.bible);
    await saveTestaments(bibleData.testaments);
    await saveBooks(bibleData.books);
    await saveChapters(bibleData.chapters);
    // await saveVerses(bibleData.verses);
}

sequelize.sync().then(() => {
  main()
    .then(() => { console.log('✅ Done.'); process.exit(0); })
    .catch((err) => { console.error('❌ Erreur lors de l’import:', err); process.exit(1); });
});
