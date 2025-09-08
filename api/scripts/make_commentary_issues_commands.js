/* scripts/make_commentary_issues_commands.js */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { sequelize, Commentary, CommentaryVerse, Verse, Chapter, Book } = require('../models');

// -------------------- Paramètres --------------------
const LIMIT_PER_BOOK = Number(process.env.LIMIT_PER_BOOK || 10);      // nb max de commentaires par livre
const REPO           = process.env.REPO || 'jlbiahdev/lissenapp';     // repo cible
const MILESTONE      = process.env.MILESTONE || '10';                  // numéro (ou titre) du milestone
const LABELS         = process.env.LABELS || 'commentaires,forge';     // labels CSV (optionnel)
const DELAY_SEC      = Number(process.env.DELAY_SEC || 2);             // délai entre issues (en secondes)
const TITLE_PREFIX   = process.env.TITLE_PREFIX || 'Forge — Commentaires à valider';

// -------------------- Utils --------------------
function shellEscape(s = '') {
  // On entoure simplement de quotes ; le body est écrit dans un fichier, donc pas de casse ici.
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function chunkText(str, max = 1000) {
  // pas nécessaire ici, mais utile si besoin d’énormes bodies segmentés
  const out = [];
  for (let i = 0; i < str.length; i += max) out.push(str.slice(i, i + max));
  return out;
}

// -------------------- Core --------------------
async function fetchUnapprovedByBook(limitPerBook) {
  // On récupère par livre les commentaires non approuvés
  // Hypothèse: chaque commentaire appartient à un seul chapitre/livre (ton invariant).
  const rows = await Commentary.findAll({
    where: { approved: false },
    attributes: ['id', 'title', 'updatedAt', 'createdAt'],
    include: [{
      model: Verse,
      as: 'verses',
      attributes: ['id', 'number'],
      through: { attributes: [] },
      include: [{
        model: Chapter, as: 'chapter',
        attributes: ['id', 'number'],
        include: [{ model: Book, as: 'book', attributes: ['id', 'code', 'name'] }]
      }]
    }],
    order: [['id', 'ASC']],
  });

  // Regrouper par livre (book.code), puis limiter à N par livre
  const byBook = new Map();
  for (const c of rows) {
    const v0 = (c.verses || [])[0];
    if (!v0?.chapter?.book) continue;
    const book = v0.chapter.book;
    const key = book.code; // ex: GEN, EXO, ...
    if (!byBook.has(key)) {
      byBook.set(key, { book, items: [] });
    }
    byBook.get(key).items.push(c);
  }

  // limiter et ne garder que les livres avec au moins 1 item
  const result = [];
  for (const [, grp] of byBook.entries()) {
    const limited = grp.items.slice(0, limitPerBook);
    if (limited.length > 0) result.push({ book: grp.book, items: limited });
  }

  // Ordonner par id "Book" si souhaité (ici on garde l’ordre d’insertion)
  return result;
}

function buildIssueBody({ book, items }) {
  // Corps de l’issue en Markdown, avec checklist
  // Chaque ligne : - [ ] #<id> <title>
  const lines = [];
  lines.push(`# Commentaires à compléter/valider — ${book.name} (${book.code})`);
  lines.push('');
  lines.push(`> Sélection des ${items.length} premiers commentaires non approuvés pour ce livre.`);
  lines.push('');
  for (const c of items) {
    // ex : - [ ] #123 Exode 10:3-4
    const title = c.title || `Commentaire ${c.id}`;
    lines.push(`- [ ] #${c.id} ${title}`);
  }
  lines.push('');
  lines.push(`_Auto-généré par make_commentary_issues_commands.js_`);
  return lines.join('\n');
}

function buildShellScript(groups) {
  // Génère un .sh qui pour chaque groupe (livre) :
  // 1) écrit un fichier /tmp body
  // 2) lance gh issue create --repo ... --title ... --milestone ... --label ... --body-file ...
  const lines = [];
  lines.push('#!/usr/bin/env bash');
  lines.push(`# Fichier généré automatiquement — création d'issues par livre`);
  lines.push(`set -e`);
  lines.push('');

  const tmpDirVar = 'TMPDIR_ISSUES';
  lines.push(`${tmpDirVar}="${path.posix.join('/tmp', `forge_issues_${Date.now()}`)}"`);
  lines.push(`mkdir -p "$${tmpDirVar}"`);
  lines.push('');

  for (const grp of groups) {
    const { book, items } = grp;
    const fileBase = `issue_body_${book.code}.md`;
    const fileVar = `BODY_${book.code}`;
    lines.push(`# ==== ${book.code} — ${book.name} ====`);
    lines.push(`${fileVar}="$${tmpDirVar}/${fileBase}"`);
    lines.push(`cat > "$${fileVar}" <<'EOF'`);
    lines.push(buildIssueBody({ book, items }));
    lines.push('EOF');
    lines.push('');

    const title = `${TITLE_PREFIX} — ${book.name} (${book.code})`;
    const args = [
      `--repo ${shellEscape(REPO)}`,
      `--title ${shellEscape(title)}`,
      `--milestone ${shellEscape(MILESTONE)}`,
      LABELS ? `--label ${shellEscape(LABELS)}` : ``,
      `--body-file "$${fileVar}"`,
    ].filter(Boolean);

    lines.push(`echo "Création de l'issue pour ${book.code}…"`);
    lines.push(`gh issue create ${args.join(' ')}`);
    lines.push(`sleep ${DELAY_SEC}`);
    lines.push('');
  }

  lines.push(`echo "✅ Terminé."`);
  return lines.join('\n');
}

// -------------------- Main --------------------
async function main() {
  console.log('🔌 Connexion DB…');
  await sequelize.authenticate();
  console.log('✅ DB connectée');

  const groups = await fetchUnapprovedByBook(LIMIT_PER_BOOK);
  if (!groups.length) {
    console.log('ℹ️ Aucun commentaire non approuvé trouvé.');
    await sequelize.close();
    return;
  }

  const script = buildShellScript(groups);
  const outFile = path.join(process.cwd(), 'create_commentary_issues.sh');
  fs.writeFileSync(outFile, script, 'utf8');

  await sequelize.close();
  console.log('✅ Script généré :', outFile);
  console.log('ℹ️ Exécution:');
  console.log('   chmod +x create_commentary_issues.sh');
  console.log('   ./create_commentary_issues.sh');
  console.log('');
  console.log('Paramètres (env): LIMIT_PER_BOOK, REPO, MILESTONE, LABELS, DELAY_SEC, TITLE_PREFIX');
}

main().catch(e => {
  console.error('❌', e?.message || e);
  process.exit(1);
});
