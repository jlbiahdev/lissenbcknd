const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Theme = sequelize.define("themes", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  }
}, {
  timestamps: false,
  freezeTableName: true
});

module.exports = Theme;
