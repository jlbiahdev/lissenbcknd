const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Book = sequelize.define("Book", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  testamentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "testament_id",
    references: { model: 'testaments', key: 'id' }
  },
  chaptersCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "chapters_count"
  },
  // horodatages
  createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
}, {
  tableName: "books",
  timestamps: true,
});

module.exports = Book;
