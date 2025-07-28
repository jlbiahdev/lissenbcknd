// scripts/importBibleVerses.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Book, Verse, sequelize } = require('../models');

const sourcePath = path.join(__dirname, '../data/initial/lsg1910.json');
const raw = fs.readFileSync(sourcePath, 'utf-8');
const data = JSON.parse(raw);

async function format() {
  const result = [];
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');

    const books = await Book.findAll({
      where: { bibleCode: 'LSG1910' }
    });

  for (const testament of data.testaments) {
    for (const book of testament.books) {
      const bookId = books.find(b => b.name.toUpperCase() === book.name.toUpperCase()).id;
      // console.log('bookCode', bookCode)
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          result.push({
            bookId: bookId,
            chapterNum: chapter.number,
            verseNum: verse.id,
            text: verse.text,
            refs: [] //Array.isArray(verse.ref) ? verse.ref.join(', ') : (verse.ref ? [verse.ref] : [])
          });
        }
      }
    }
  }

  // console.log('result', result)
  return result;
  } catch (err) {
    console.error('❌ Erreur chargement versets:', err);
    process.exit(1);
  }
}

async function importVerses() {
  try {
    await sequelize.authenticate();
    const verses = await format();

    // Insertion en bulk
    await Verse.bulkCreate(verses, {
      ignoreDuplicates: true
    });

    console.log(`✅ ${verses.length} versets importés`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur import verses:', err);
    process.exit(1);
  }
}

importVerses();
