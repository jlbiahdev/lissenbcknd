const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Theme = sequelize.define("themes", {
  name: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  }
}, {
  timestamps: false,
  freezeTableName: true
});

module.exports = Theme;
