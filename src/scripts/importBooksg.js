const fs = require('fs');
const path = require('path');
const { sequelize, Book } = require('../models');

async function importBooks() {
  const filePath = path.join(__dirname, '../data/books.lsg.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const books = JSON.parse(rawData);

  for (const book of books) {
    await Book.upsert(book);
  }

  console.log(`✅ Livres importés : ${books.length}`);
}

sequelize.sync().then(() => {
  importBooks()
    .then(() => process.exit())
    .catch(err => {
      console.error('❌ Erreur import books:', err);
      process.exit(1);
    });
});
