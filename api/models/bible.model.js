const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Bible = sequelize.define("Bible", {
  code: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: DataTypes.STRING,
  language: DataTypes.STRING,
  editionYear: {
    type: DataTypes.INTEGER,
    field: "edition_year"
  },
  
  // horodatages
  createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
}, {
  tableName: "bibles",
  timestamps: true,
  returning: false,
});

module.exports = Bible;
