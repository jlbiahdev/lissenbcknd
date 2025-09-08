/* scripts/make_commentary_issues_commands.js */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { sequelize, Commentary, CommentaryVerse, Verse, Chapter, Book } = require('../models');

// -------------------- Paramètres --------------------
const LIMIT_PER_BOOK = Number(process.env.LIMIT_PER_BOOK || 2);
const REPO           = process.env.REPO || 'jlbiahdev/lissenapp';
const MILESTONE      = process.env.MILESTONE || 'Rédaction de Commentaires'; // titre du milestone
const LABELS         = process.env.LABELS || 'commentaries,forge';           // CSV: ex "label1,label2"
const DELAY_SEC      = Number(process.env.DELAY_SEC || 2);
const TITLE_PREFIX   = process.env.TITLE_PREFIX || 'Forge — Commentaires à valider';

// -------------------- Utils --------------------
function shellEscape(s = '') {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function splitLabels(csv) {
  return String(csv)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// -------------------- Core --------------------
async function fetchUnapprovedByBook(limitPerBook) {
  const rows = await Commentary.findAll({
    where: { approved: false },
    attributes: ['id', 'title', 'updatedAt', 'createdAt'],
    include: [{
      model: Verse, as: 'verses', attributes: ['id', 'number'], through: { attributes: [] },
      include: [{ model: Chapter, as: 'chapter', attributes: ['id', 'number'],
        include: [{ model: Book, as: 'book', attributes: ['id', 'code', 'name'] }] }]
    }],
    order: [['id', 'ASC']],
  });

  const byBook = new Map();
  for (const c of rows) {
    const v0 = (c.verses || [])[0];
    if (!v0?.chapter?.book) continue;
    const book = v0.chapter.book;
    const key = book.code;
    if (!byBook.has(key)) byBook.set(key, { book, items: [] });
    byBook.get(key).items.push(c);
  }

  const result = [];
  for (const [, grp] of byBook.entries()) {
    const limited = grp.items.slice(0, limitPerBook);
    if (limited.length > 0) result.push({ book: grp.book, items: limited });
  }
  return result;
}

function buildIssueBody({ book, items }) {
  const lines = [];
  lines.push(`# Commentaires à compléter/valider — ${book.name} (${book.code})`);
  lines.push('');
  lines.push(`> Sélection des ${items.length} premiers commentaires non approuvés pour ce livre.`);
  lines.push('');
  for (const c of items) {
    const title = c.title || `Commentaire ${c.id}`;
    lines.push(`- [ ] ${title}`);
  }
  lines.push('');
  lines.push(`_Auto-généré par make_commentary_issues_commands.js_`);
  return lines.join('\n');
}

function buildShellScript(groups) {
  const labelList = splitLabels(LABELS);

  const lines = [];
  lines.push('#!/usr/bin/env bash');
  lines.push(`# Généré automatiquement — création d'issues par livre via gh api`);
  lines.push('set -Eeuo pipefail');
  lines.push('');
  lines.push(`REPO=${shellEscape(REPO)}`);
  lines.push(`MST_TITLE=${shellEscape(MILESTONE)}`);
  lines.push(`DELAY_SEC=${shellEscape(String(DELAY_SEC))}`);
  lines.push(`TITLE_PREFIX=${shellEscape(TITLE_PREFIX)}`);
  lines.push('');
  lines.push(`gh auth status >/dev/null || { echo "❌ gh non authentifié. Exécute: gh auth login" >&2; exit 1; }`);
  lines.push('');
  lines.push(`log(){ echo "$*" >&2; }`);
  lines.push('');
  // ⚠️ Endpoints SANS slash initial (Git Bash Windows friendly)
  lines.push(`ensure_milestone_open_and_get_number() {`);
  lines.push(`  local repo="$1"; local title="$2"`);
  lines.push(`  local num`);
  lines.push(`  num="$(gh api -H "Accept: application/vnd.github+json" "repos/$repo/milestones" --method GET -F state=all -F per_page=100 --jq ".[] | select(.title==\\"$title\\") | .number" 2>/dev/null || true)"`);
  lines.push(`  if [[ -z "$num" ]]; then`);
  lines.push(`    num="$(gh api -X POST -H "Accept: application/vnd.github+json" "repos/$repo/milestones" -f title="$title" -f state=open --jq .number)"`);
  lines.push(`    log "✅ Milestone créé: '$title' (#$num)"`);
  lines.push(`  else`);
  lines.push(`    local state; state="$(gh api -H "Accept: application/vnd.github+json" "repos/$repo/milestones/$num" --jq .state)"`);
  lines.push(`    if [[ "$state" != "open" ]]; then`);
  lines.push(`      gh api -X PATCH -H "Accept: application/vnd.github+json" "repos/$repo/milestones/$num" -f state=open >/dev/null`);
  lines.push(`      log "🔁 Milestone réouvert: '$title' (#$num)"`);
  lines.push(`    fi`);
  lines.push(`  fi`);
  lines.push(`  echo "$num"`); // stdout: number uniquement
  lines.push(`}`);
  lines.push('');
  lines.push(`MST_NUMBER="$(ensure_milestone_open_and_get_number "$REPO" "$MST_TITLE")"`);
  lines.push(`log "➡️  Milestone ciblé: #$MST_NUMBER (titre: $MST_TITLE)"`);
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

    // Construire les flags labels[]=...
    const labelFlags = labelList.map(lbl => `-f labels[]=${shellEscape(lbl)}`).join(' \\\n  ');

    // Création via gh api (POST /repos/:owner/:repo/issues)
    lines.push(`echo "Création de l'issue pour ${book.code}…"`);
    lines.push(`gh api "repos/$REPO/issues" -X POST \\`);
    lines.push(`  -f title=${shellEscape(title)} \\`);
    lines.push(`  -f milestone="$MST_NUMBER" \\`);
    if (labelFlags) {
      lines.push(`  ${labelFlags} \\`);
    }
    lines.push(`  -f body="$(cat "$${fileVar}")" \\`);
    lines.push(`  --jq '.html_url'`);
    lines.push(`sleep "$DELAY_SEC"`);
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

  // Forcer LF pour compat Windows Git Bash
  const outFile = path.join(process.cwd(), 'scripts/6-create_commentary_issues.sh');
  fs.writeFileSync(outFile, script.replace(/\r\n/g, '\n'), 'utf8');

  await sequelize.close();
  console.log('✅ Script généré :', outFile);
  console.log('ℹ️ Exécution:');
  console.log('   chmod +x scripts/6-create_commentary_issues.sh');
  console.log('   ./scripts/6-create_commentary_issues.sh');
  console.log('');
  console.log('Paramètres (env): LIMIT_PER_BOOK, REPO, MILESTONE, LABELS, DELAY_SEC, TITLE_PREFIX');
}

main().catch(e => {
  console.error('❌', e?.message || e);
  process.exit(1);
});
