// models/MeditativeVerse.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MeditativeVerse = sequelize.define("MeditativeVerse", {
  id: {
    type: DataTypes.BIGINT,          // BIGSERIAL
    primaryKey: true,
    autoIncrement: true,
  },
  verseId: {
    type: DataTypes.INTEGER,
    field: "verse_id",
    allowNull: false,
    unique: "uq_meditative_verse",
  },
  commentary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "approved",
  },
  // horodatages
  createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
  commentaryUpdatedAt: { type: DataTypes.DATE, allowNull: true, field: "commentary_updated_at", },
},
{
  tableName: "meditative_verses",
  freezeTableName: true,
  timestamps: true,            // mappe createdAt/updatedAt
  createdAt: "created_at",
  updatedAt: "updated_at",
  underscored: true,
  returning: false,
});

module.exports = MeditativeVerse;
