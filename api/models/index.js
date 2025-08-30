const sequelize = require("../config/db");

const Book = require("./book.model");
const Testament = require("./testament.model");
const Bible = require("./bible.model");
const Chapter = require("./chapters.model");
const Verse = require("./verse.model");
const MeditationVerse = require("./meditationVerse.model");
const Meditation = require('./meditation.model')
const Theme = require("./theme.model");
const CategoryTheme = require("./categoryTheme.model");

// Associations Bible ↔ Testament
Bible.hasMany(Testament, { foreignKey: 'bible_code', as: 'Testaments' });

// Associations Testament ↔ Bible
Testament.belongsTo(Bible, { foreignKey: 'bible_code', targetKey: 'code', as: 'Bible' });

// Associations Testament ↔ Book
Testament.hasMany(Book, { foreignKey: 'testament_id', as: 'Books' });

// Associations Book ↔ Testament
Book.belongsTo(Testament, { foreignKey: 'testament_id', targetKey: 'id', as: 'Testament' });

// Associations Book ↔ Chapter
Book.hasMany(Chapter, { foreignKey: 'bookId', as: 'Chapters' });

// Associations Book ↔ Verses
Book.hasMany(Verse, { foreignKey: 'bookId', as: 'Verses' });

// Associations Chapter ↔ Book
Chapter.belongsTo(Book, { foreignKey: 'bookId', as: 'Book' });

Verse.belongsTo(Book, { foreignKey: 'bookId', as: 'Book' });

// Associations Verse ↔ Meditation
Verse.belongsToMany(Meditation, {
  through: MeditationVerse,
  foreignKey: "verse_id",
  otherKey: "meditation_id",
  as: "Meditations",
});

Meditation.belongsToMany(Verse, {
  through: MeditationVerse,
  foreignKey: "meditation_id",
  otherKey: "verse_id",
  as: "Verses",
});

// Verse ↔ Thèmes (si ce n’est pas déjà fait)
Verse.belongsToMany(Theme, {
  through: "verse_themes",
  foreignKey: "verse_id",
  otherKey: "theme_id",
  as: "Themes",
});
Theme.belongsToMany(Verse, {
  through: "verse_themes",
  foreignKey: "theme_id",
  otherKey: "verse_id",
  as: "Verses"
});

// Liens directs pour naviguer/charger vite
Meditation.hasMany(MeditationVerse, { as: "Links", foreignKey: "meditation_id" });
MeditationVerse.belongsTo(Meditation, { foreignKey: "meditation_id" });
MeditationVerse.belongsTo(Verse,      { foreignKey: "verse_id", as: 'Verse' });

// Associations
CategoryTheme.hasMany(Theme, { foreignKey: 'category_id', as: 'Themes' });
Theme.belongsTo(CategoryTheme, { foreignKey: 'category_id', as: 'Category' });


module.exports = {
  sequelize,
  Bible,
  Testament,
  Book,
  Chapter,
  Verse,
  Meditation,
  MeditationVerse,
  CategoryTheme,
  Theme,
};
