const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Bible = sequelize.define("bible", {
  code: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: DataTypes.STRING,
  language: DataTypes.STRING,
  editionYear: {
    type: DataTypes.INTEGER,
    field: "edition_year"
  }
}, {
  timestamps: false,
  returning: false
});

module.exports = Bible;
