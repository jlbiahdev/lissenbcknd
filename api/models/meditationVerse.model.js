const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MeditationVerse = sequelize.define("MeditationVerse", {
    meditationId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        field: "meditation_id",
        references: { model: "meditations", key: "id" },
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
    tableName: "meditation_verses",
    underscored: true,
    timestamps: false,
    defaultScope: { order: [["position", "ASC"]] },
    indexes: [
        { name: "idx_meditation_verses_meditation", fields: ["meditation_id"] },
        { name: "idx_meditation_verses_verse",      fields: ["verse_id"] },
        // contraintes d’unicité (miroir de la DB)
        { name: "uq_meditation_verse",    unique: true, fields: ["meditation_id", "verse_id"] },
    ],
});

module.exports = MeditationVerse;

