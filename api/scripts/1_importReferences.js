require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { CategoryTheme, Theme, sequelize } = require('../models');

async function importThemes() {
  const filePath = path.join(__dirname, '../data/references.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');

    for (const category of data.categories) {
      await CategoryTheme.findOrCreate({
        where: { id: category.id, name: category.name.trim(), description: category.description.trim(), keywords: category.keywords.map(k => k.trim()) }
      });
    }

    console.log('themes', data.themes)
    for (const theme of data.themes) {
      await Theme.findOrCreate({
        where: { id: theme.id, categoryId: theme.category_id, name: theme.name.trim(), keywords: theme.keywords.map(k => k.trim()) }
      });
    }

    console.log(`✅ ${data.themes.length} thèmes importés ou déjà existants`);
    process.exit(0);
  } catch (err) {
    throw('❌ Erreur import themes:', err);
  }
}

async function main() {
  await importThemes();
}

sequelize.sync().then(() => {
    main()
      .then(() => { 
        console.log('✅ Done.');
        process.exit(0);
      })
      .catch((err) => { 
        console.error('❌ Erreur lors de l’import:', err); 
        process.exit(1);
      });
});