const fs = require('fs');
const path = require('path');
const { sequelize, Book, MeditativeVerse, Verse } = require('../models');

async function importMeditativeVerses() {
  let filePath = path.join(__dirname, '../data/initial/lsg1910.json');
  let rawData = fs.readFileSync(filePath, 'utf-8');
  let  data = JSON.parse(rawData);
  const result = [];
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');
    
    const books = await Book.findAll({
      where: { bibleCode: 'LSG1910' }
    });

    const bookIds = books.map(b => b.id);
    const verses = await Verse.findAll({
      where: {
        bookId: bookIds
      }
    });

    console.log('✅ Loaded verses :', verses.length);

    for (const testament of data.testaments) {
      for (const book of testament.books) {
        const bookId = books.find(b => b.name.toUpperCase() === book.name.toUpperCase()).id;
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses.filter(v => v.meditative === true)) {
            result.push({
              bookId: bookId,
              chapterNum: chapter.number,
              verseNum: verse.id
            });
          }
        }
      }
    }
    filePath = path.join(__dirname, '../data/lsg1910_verses_commentated.json');
    rawData = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(rawData);

    function formatVerseRef(ref) {
      const parts = ref.split(' ');
      return {
        bookName: parts.slice(0, -1).join(' '),
        chapterVerse: parts[parts.length - 1]
      };
    }

    // let currentVerseCount = 0;
    let created = 0, updated = 0;

    for (const verse of data) {
      const { bookName, chapterVerse } = formatVerseRef(verse.ref);
      const [chapter, verseNum] = chapterVerse.split(':');

      const book = books.find(b => b.name.toUpperCase() === bookName.toUpperCase());
      // console.log('bookName', bookName, 'bookCode', book.code, 'chapter', chapter, 'verseNum', verseNum);
      const currentVerse = verses.find(v => v.bookId === book.id && v.chapterNum === parseInt(chapter) && v.verseNum === parseInt(verseNum));
      const [record, isCreated] = await MeditativeVerse.upsert({
        verseId: currentVerse.id,
        themes: verse.themes,
        commentary: verse.commentary,
        verseApproved: true,
        commentApproved: false
      });

      if (isCreated) created++;
      else updated++;

      // if (currentVerse) currentVerseCount++;
      // console.log('currentVerse', currentVerse.id, 'verseNum', verseNum);
    }

    console.log(`✅ Import terminé. Créés: ${created}, Mis à jour: ${updated}`);
    // console.log('currentVerseCount', currentVerseCount);
    
  } catch (err) {
    console.error('❌ Erreur chargement versets:', err);
    process.exit(1);
  }
  // for (const verse of verses) {
}

sequelize.sync().then(() => {
  importMeditativeVerses()
    .then(() => {
      console.log('✅ Done.');
      process.exit();
    })
    .catch((err) => {
      console.error('❌ Erreur lors de l’import:', err);
      process.exit(1);
    });
});
