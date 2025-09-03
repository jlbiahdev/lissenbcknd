const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Commentary = sequelize.define("Commentary", {
  id: { 
    type: DataTypes.BIGINT, 
    primaryKey: true, 
    autoIncrement: true 
  },
  title: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  text: { 
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
},
{
  tableName: "commentaries",
  freezeTableName: true,
  timestamps: true,
  underscored: true,
  returning: false,
});

module.exports = Commentary;
