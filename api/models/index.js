const sequelize = require("../config/db");

const Bible = require("./bible.model");
const Testament = require("./testament.model");
const Book = require("./book.model");
const Chapter = require("./chapters.model");
const Verse = require("./verse.model");

const Commentary = require("./commentary.model");
const CommentaryVerse = require("./commentaryVerse.model");

const CategoryTheme = require("./categoryTheme.model");
const Theme = require("./theme.model");
const VerseTheme = require("./verseThemes.model");

// -------------------- Bible ↔ Testament --------------------
Bible.hasMany(Testament, {
  foreignKey: "bibleCode",     // attribut du modèle Testament
  sourceKey: "code",
  as: "testaments",
});
Testament.belongsTo(Bible, {
  foreignKey: "bibleCode",
  targetKey: "code",
  as: "bible",
});

// -------------------- Testament ↔ Book --------------------
Testament.hasMany(Book, {
  foreignKey: "testamentId",   // attribut du modèle Book
  sourceKey: "id",
  as: "books",
});
Book.belongsTo(Testament, {
  foreignKey: "testamentId",
  targetKey: "id",
  as: "testament",
});

// -------------------- Book ↔ Chapter --------------------
Book.hasMany(Chapter, {
  foreignKey: "bookId",        // attribut du modèle Chapter
  sourceKey: "id",
  as: "chapters",
});
Chapter.belongsTo(Book, {
  foreignKey: "bookId",
  targetKey: "id",
  as: "book",
});

// -------------------- Chapter ↔ Verse --------------------
Chapter.hasMany(Verse, {
  foreignKey: "chapterId",     // attribut du modèle Verse
  sourceKey: "id",
  as: "verses",
});
Verse.belongsTo(Chapter, {
  foreignKey: "chapterId",
  targetKey: "id",
  as: "chapter",
});

// -------------------- Verse ↔ Theme (pivot VerseTheme) --------------------
Verse.belongsToMany(Theme, {
  through: VerseTheme,
  foreignKey: "verse_id",
  otherKey: "theme_id",
  as: "themes",
});
Theme.belongsToMany(Verse, {
  through: VerseTheme,
  foreignKey: "theme_id",
  otherKey: "verse_id",
  as: "verses",
});

// -------------------- CategoryTheme ↔ Theme --------------------
CategoryTheme.hasMany(Theme, {
  foreignKey: "categoryId",    // attribut du modèle Theme
  sourceKey: "id",
  as: "themes",
});
Theme.belongsTo(CategoryTheme, {
  foreignKey: "categoryId",
  targetKey: "id",
  as: "category",
});

// -------------------- Commentary ↔ Verse (pivot CommentaryVerse) --------------------
Commentary.belongsToMany(Verse, {
  through: CommentaryVerse,
  foreignKey: "commentary_id",
  otherKey: "verse_id",
  as: "verses",
});
Verse.belongsToMany(Commentary, {
  through: CommentaryVerse,
  foreignKey: "verse_id",
  otherKey: "commentary_id",
  as: "commentaries",
});

// (facultatif) Liens directs sur le pivot pour naviguer/charger vite
Commentary.hasMany(CommentaryVerse, { foreignKey: "commentary_id", as: "links" });
CommentaryVerse.belongsTo(Commentary, { foreignKey: "commentary_id", as: "commentary" });
CommentaryVerse.belongsTo(Verse, { foreignKey: "verse_id", as: "verse" });

module.exports = {
  sequelize,
  Bible,
  Testament,
  Book,
  Chapter,
  Verse,
  Commentary,
  CommentaryVerse,
  CategoryTheme,
  Theme,
  VerseTheme,
};
