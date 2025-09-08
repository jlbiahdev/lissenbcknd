/* scripts/make_generate_commentaries_commands.js */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { sequelize, Book } = require('../models');

const DELAY_SEC = Number(process.env.DELAY_SEC || 5);           // délai entre livres
const NODE_BIN  = process.env.NODE_BIN || 'node';               // si besoin de pointer vers un node spécifique
const SCRIPT    = process.env.SCRIPT || 'scripts/4_generate_commentaries.js';

async function main() {
  console.log('🔌 Connecting…');
  await sequelize.authenticate();
  console.log('✅ DB connected');

  const books = await Book.findAll({
    attributes: ['id', 'code', 'name'],
    order: [['id', 'ASC']],
  });

  if (!books.length) {
    throw new Error('Aucun livre trouvé.');
  }

  const shLines = [
    '#!/usr/bin/env bash',
    `# Généré automatiquement — exécute ${SCRIPT} livre par livre avec délai`,
    `set -e`,
    ``,
  ];

  const cmdLines = [
    `@echo off`,
    `REM Généré automatiquement — exécute ${SCRIPT} livre par livre avec délai`,
    ``,
  ];

  for (const b of books) {
    const code = b.code;
    const name = b.name || '';
    shLines.push(`echo "=== ${code} - ${name} ==="`);
    shLines.push(`${NODE_BIN} ${SCRIPT} --book=${code}`);
    shLines.push(`sleep ${DELAY_SEC}`);
    shLines.push(``);
    cmdLines.push(`echo === ${code} - ${name} ===`);
    cmdLines.push(`${NODE_BIN} ${SCRIPT} --book=${code}`);
    cmdLines.push(`timeout /t ${DELAY_SEC} /nobreak >nul`);
    cmdLines.push(``);
  }

  const outSh  = path.join(process.cwd(), 'scripts/4-commands_generate_commentaries.sh');
  // const outCmd = path.join(process.cwd(), 'scripts/4-commands_generate_commentaries.cmd');

  fs.writeFileSync(outSh,  shLines.join('\n'), 'utf8');
  // fs.writeFileSync(outCmd, cmdLines.join('\r\n'), 'utf8');

  await sequelize.close();

  console.log('✅ Fichiers générés:');
  console.log('   -', outSh);
  // console.log('   -', outCmd);
  console.log(`ℹ️ Délai entre livres: ${DELAY_SEC}s`);
  console.log(`ℹ️ Script ciblé: ${SCRIPT}`);
}

main().catch(err => {
  console.error('❌', err?.message);
  process.exit(1);
});
