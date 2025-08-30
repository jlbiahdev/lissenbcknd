const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Chapter = sequelize.define('Chapter', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'book_id',
        references: { model: 'books', key: 'id' }
    },
    versesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'verses_count'
    },

    // horodatages
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
},
{
    tableName: 'chapters',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['number', 'book_id']
        }
    ]
});

module.exports = Chapter;