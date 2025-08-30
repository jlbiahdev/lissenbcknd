const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Verse = sequelize.define("Verse", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chapterId: {
    type: DataTypes.INTEGER,
    field: "chapter_id",
    references: { model: 'chapters', key: 'id' }
  },
  number: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  refs: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
  },
  
  // horodatages
  createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
}, {
  tableName: 'verses',
  freezeTableName: true,
  timestamps: true,
});

module.exports = Verse;