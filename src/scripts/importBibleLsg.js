const fs = require('fs');
const path = require('path');
const { sequelize, Bible } = require('../models');

async function importBible() {
  const filePath = path.join(__dirname, '../data/bible.lsg.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const bibles = JSON.parse(rawData);

  for (const bible of bibles) {
    const [record, created] = await Bible.upsert({
        code: bible.code,
        name: bible.name,
        language: bible.language,
        editionYear: bible.editionYear
        }, {
        returning: false
    });

    console.log(`✅ Version LSG ${created ? "créée" : "déjà existante"}`);
    }
}

sequelize.sync().then(() => {
  importBible()
    .then(() => process.exit())
    .catch(err => {
      console.error('❌ Erreur import bible:', err);
      process.exit(1);
    });
});
