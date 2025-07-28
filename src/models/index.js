const sequelize = require("../config/db");

const Book = require("./book.model");
const Bible = require("./bible.model");
const Verse = require("./verse.model");
const MeditativeVerse = require("./meditative_verse.model");

// Associations
Book.belongsTo(Bible, { foreignKey: 'bibleCode' });

Verse.belongsTo(Book, { foreignKey: 'bookId' });

MeditativeVerse.belongsTo(Verse, { foreignKey: 'verseId' });

module.exports = {
  sequelize,
  Book,
  Bible,
  Verse,
  MeditativeVerse,
};
