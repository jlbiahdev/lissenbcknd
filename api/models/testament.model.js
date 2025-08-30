const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Testament = sequelize.define('Testament', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    bibleCode: {
      type: DataTypes.TEXT,
      allowNull: false, 
      field: "bible_code",
      references: { model: 'bibles', key: 'code' }
    },
    // horodatages
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
  }, {
    tableName: 'testaments',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['name', 'bible_code']
      }
    ]
  });


module.exports = Testament;
