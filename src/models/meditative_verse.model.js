const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MeditativeVerse = sequelize.define("meditative_verses", {
  verseId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "verse_id"
  },
  themes: DataTypes.ARRAY(DataTypes.STRING),
  commentary: DataTypes.TEXT,
  verseApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "verse_approved"
  },
  commentApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "comment_approved"
  }
}, {
  timestamps: false,
  freezeTableName: true,
  underscored: true,
  returning: false
});

module.exports = MeditativeVerse;
