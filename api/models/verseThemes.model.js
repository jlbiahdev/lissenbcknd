const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

  const VerseTheme = sequelize.define('VerseTheme', {
    verseId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "verse_id",
      references: { model: 'verses', key: 'id' },
      onDelete: 'CASCADE',
      primaryKey: true
    },
    themeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "theme_id",
      references: { model: 'themes', key: 'id' },
      onDelete: 'CASCADE',
      primaryKey: true
    },
    // horodatages
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
  }, {
    tableName: 'verse_themes',
    timestamps: true,
    freezeTableName: true,
  });

module.exports = VerseTheme;