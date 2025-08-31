// services/theme.service.js
const { Theme, CategoryTheme, sequelize } = require("../models");
const { Op } = require("sequelize");

/**
 * Liste des thèmes, triés par nom (ASC).
 * NOTE: pas d'include catégorie ici puisque l'ancien contrat ne l'exposait pas.
 */
async function getAll() {
  return Theme.findAll({ order: [["name", "ASC"]] });
}

/**
 * Ajoute un thème.
 * CONTRAT NOUVEAU (imposé par le modèle) :
 *   input: { name, categoryId, keywords }
 * Retour:
 *   - { alreadyExists: true } si name (case-insensitive) existe déjà
 *   - { invalidCategory: true } si categoryId n'existe pas
 *   - { added: true, id } si OK
 */
async function add({ name, categoryId, keywords }) {
  if (!name || !categoryId || !Array.isArray(keywords)) {
    throw new Error("Missing required fields: { name, categoryId, keywords[] }");
  }

  // unicité nom (case-insensitive)
  const existing = await Theme.findOne({
    where: sequelize.where(
      sequelize.fn("lower", sequelize.col("name")),
      name.toLowerCase()
    ),
    attributes: ["id"],
  });
  if (existing) return { alreadyExists: true };

  // catégorie valide ?
  const cat = await CategoryTheme.findByPk(categoryId, { attributes: ["id"] });
  if (!cat) return { invalidCategory: true };

  const created = await Theme.create({ name, categoryId, keywords });
  return { added: true, id: created.id };
}

/**
 * Met à jour un thème.
 * CONTRAT NOUVEAU (imposé par le modèle) :
 *   input: id, patch = { name?, categoryId?, keywords? }
 * Retour:
 *   - { notFound: true } si id inexistant
 *   - { alreadyExists: true } si name clash (case-insensitive) avec un autre id
 *   - { invalidCategory: true } si categoryId fourni mais inexistant
 *   - { updated: true }
 */
async function edit(id, patch) {
  if (!id) throw new Error("Missing theme id");
  const theme = await Theme.findByPk(id);
  if (!theme) return { notFound: true };

  const { name, categoryId, keywords } = patch || {};

  // contrôle unicité du name si modifié
  if (typeof name === "string" && name.trim().length > 0) {
    const existing = await Theme.findOne({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("lower", sequelize.col("name")),
            name.toLowerCase()
          ),
          { id: { [Op.ne]: id } },
        ],
      },
      attributes: ["id"],
    });
    if (existing) return { alreadyExists: true };
    theme.name = name;
  }

  // contrôle catégorie si modifiée
  if (typeof categoryId === "number") {
    const cat = await CategoryTheme.findByPk(categoryId, { attributes: ["id"] });
    if (!cat) return { invalidCategory: true };
    theme.categoryId = categoryId;
  }

  // keywords si fournis (doit rester un array, pas null)
  if (keywords !== undefined) {
    if (!Array.isArray(keywords)) throw new Error("keywords must be an array");
    theme.keywords = keywords;
  }

  await theme.save();
  return { updated: true };
}

module.exports = {
  getAll,
  add,
  edit,
};
