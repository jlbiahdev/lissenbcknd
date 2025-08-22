const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Verse = sequelize.define("verses", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookId: {
    type: DataTypes.INTEGER,
    field: "book_id"
  },
  chapterNum: {
    type: DataTypes.INTEGER,
    field: "chapter_number"
  },
  verseNum: {
    type: DataTypes.INTEGER,
    field: "number"
  },
  text: DataTypes.TEXT,
  refs: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
  }
}, {
  freezeTableName: true,
  timestamps: false
});

module.exports = Verse;