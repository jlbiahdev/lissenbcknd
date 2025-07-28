const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Book = sequelize.define("book", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bibleCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "bible_code"
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  testament: {
    type: DataTypes.ENUM("old", "new"),
    allowNull: false,
  },
}, {
  timestamps: false
});

module.exports = Book;
