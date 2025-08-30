const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Meditation = sequelize.define("Meditation", {
  id: { 
    type: DataTypes.BIGINT, 
    primaryKey: true, 
    autoIncrement: true 
  },
  commentary: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  approved: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false, 
    defaultValue: false, 
  },
  // horodatages
  createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
  commentaryUpdatedAt: { type: DataTypes.DATE, allowNull: true, field: "commentary_updated_at", },
},
{
  tableName: "meditations",
  freezeTableName: true,
  timestamps: true,
  underscored: true,
  returning: false,
});

module.exports = Meditation;
