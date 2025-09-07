const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CategoryTheme = sequelize.define('CategoryTheme', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  keywords: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: false
  },
  // horodatages
  createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
}, {
  tableName: 'category_themes',
  timestamps: true
});


module.exports = CategoryTheme;
