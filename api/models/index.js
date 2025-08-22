const sequelize = require("../config/db");

const Book = require("./book.model");
const Bible = require("./bible.model");
const Verse = require("./verse.model");
const MeditativeVerse = require("./meditative_verse.model");
const Theme = require("./theme.model");

// Associations Bible ↔ Books
Bible.hasMany(Book, { foreignKey: 'bibleCode', as: 'Books' });
Book.belongsTo(Bible, { foreignKey: 'bibleCode', as: 'Bible' });

// Associations Book ↔ Verses
Book.hasMany(Verse, { foreignKey: 'bookId', as: 'Verses' });
Verse.belongsTo(Book, { foreignKey: 'bookId', as: 'Book' });

// Associations Verse ↔ MeditativeVerse
MeditativeVerse.belongsTo(Verse, { foreignKey: 'verseId', as: 'verse' });
// MeditativeVerse.belongsToMany(Theme, {
//   through: 'meditative_verse_themes',
//   as: 'Themes',
//   foreignKey: 'meditativeVerseId',
// });

module.exports = {
  sequelize,
  Book,
  Bible,
  Verse,
  MeditativeVerse,
  Theme,
};
