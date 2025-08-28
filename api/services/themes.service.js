const { Theme } = require("../models");
const { sequelize } = require("../models");

async function getAll() {
  return await Theme.findAll({ order: [['name', 'ASC']] });
}

async function add(name) {
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

async function edit(id, newName) {
  const existing = await Theme.findOne({
    where: sequelize.where(
      sequelize.fn('lower', sequelize.col('name')),
      newName.toLowerCase()
    )
  });

  if (existing && existing.id !== id) return { alreadyExists: true };

  const theme = await Theme.findByPk(id);
  if (!theme) return { notFound: true };

  theme.name = newName;
  await theme.save();
  return { updated: true };
}

module.exports = {
  getAll,
  add,
  edit
};
