const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CommentaryVerse = sequelize.define("CommentaryVerse", {
    commentaryId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        field: "commentary_id",
        references: { model: "commentaries", key: "id" },
        onDelete: "CASCADE",
    },
    verseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        field: "verse_id",
        references: { model: "verses", key: "id" },
        onDelete: "CASCADE",
    },
    
    // horodatages
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
}, {
    tableName: "commentary_verses",
    underscored: true,
    timestamps: false,
    defaultScope: { order: [["position", "ASC"]] },
    indexes: [
        { name: "idx_commentary_verses_commentary", fields: ["commentary_id"] },
        { name: "idx_commentary_verses_verse",      fields: ["verse_id"] },
        // contraintes d’unicité (miroir de la DB)
        { name: "uq_commentary_verse",    unique: true, fields: ["commentary_id", "verse_id"] },
    ],
});

module.exports = CommentaryVerse;

