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
Verse.hasOne(MeditativeVerse, { foreignKey: 'verseId', as: 'Meditative' });
MeditativeVerse.belongsTo(Verse, { foreignKey: 'verseId', as: 'Verse' });
MeditativeVerse.belongsToMany(Theme, {
  through: "meditative_verse_themes",
  foreignKey: "meditative_verse_id",
  otherKey: "theme_id",
  as: "themes"
});

Theme.belongsToMany(MeditativeVerse, {
  through: "meditative_verse_themes",
  foreignKey: "theme_id",
  otherKey: "meditative_verse_id",
  as: "verses"
});


module.exports = {
  sequelize,
  Book,
  Bible,
  Verse,
  MeditativeVerse,
  Theme,
};
