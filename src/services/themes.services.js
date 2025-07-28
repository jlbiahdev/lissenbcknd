const { Theme } = require("../models");
const { sequelize } = require("../models");

async function getAllThemes() {
  return await Theme.findAll({ order: [['name', 'ASC']] });
}

async function addTheme(name) {
  const existing = await Theme.findOne({
    where: sequelize.where(
      sequelize.fn('lower', sequelize.col('name')),
      name.toLowerCase()
    )
  });

  if (existing) return { alreadyExists: true };

  await Theme.create({ name });
  return { added: true };
}

module.exports = {
  getAllThemes,
  addTheme
};
