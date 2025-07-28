require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Theme, sequelize } = require('../models');

async function importThemes() {
  const filePath = path.join(__dirname, '../data/themes.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const themes = JSON.parse(raw);

  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');

    for (const theme of themes) {
      await Theme.findOrCreate({
        where: { name: theme.name.trim() }
      });
    }

    console.log(`✅ ${themes.length} thèmes importés ou déjà existants`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur import themes:', err);
    process.exit(1);
  }
}

importThemes();
