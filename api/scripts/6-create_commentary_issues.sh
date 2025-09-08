#!/usr/bin/env bash
# Généré automatiquement — création d'issues par livre via gh api
set -Eeuo pipefail

REPO='jlbiahdev/lissenapp'
MST_TITLE='Rédaction de Commentaires'
DELAY_SEC='2'
TITLE_PREFIX='Forge — Commentaires à valider'

gh auth status >/dev/null || { echo "❌ gh non authentifié. Exécute: gh auth login" >&2; exit 1; }

log(){ echo "$*" >&2; }

ensure_milestone_open_and_get_number() {
  local repo="$1"; local title="$2"
  local num
  num="$(gh api -H "Accept: application/vnd.github+json" "repos/$repo/milestones" --method GET -F state=all -F per_page=100 --jq ".[] | select(.title==\"$title\") | .number" 2>/dev/null || true)"
  if [[ -z "$num" ]]; then
    num="$(gh api -X POST -H "Accept: application/vnd.github+json" "repos/$repo/milestones" -f title="$title" -f state=open --jq .number)"
    log "✅ Milestone créé: '$title' (#$num)"
  else
    local state; state="$(gh api -H "Accept: application/vnd.github+json" "repos/$repo/milestones/$num" --jq .state)"
    if [[ "$state" != "open" ]]; then
      gh api -X PATCH -H "Accept: application/vnd.github+json" "repos/$repo/milestones/$num" -f state=open >/dev/null
      log "🔁 Milestone réouvert: '$title' (#$num)"
    fi
  fi
  echo "$num"
}

MST_NUMBER="$(ensure_milestone_open_and_get_number "$REPO" "$MST_TITLE")"
log "➡️  Milestone ciblé: #$MST_NUMBER (titre: $MST_TITLE)"

TMPDIR_ISSUES="/tmp/forge_issues_1757357535090"
mkdir -p "$TMPDIR_ISSUES"

# ==== GEN — Genèse ====
BODY_GEN="$TMPDIR_ISSUES/issue_body_GEN.md"
cat > "$BODY_GEN" <<'EOF'
# Commentaires à compléter/valider — Genèse (GEN)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #1 Genèse 5:1
- [ ] #2 Genèse 5:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour GEN…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Genèse (GEN)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_GEN")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== EXO — Exode ====
BODY_EXO="$TMPDIR_ISSUES/issue_body_EXO.md"
cat > "$BODY_EXO" <<'EOF'
# Commentaires à compléter/valider — Exode (EXO)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #801 Exode 1:1
- [ ] #802 Exode 1:5

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour EXO…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Exode (EXO)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_EXO")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== LEV — Lévitique ====
BODY_LEV="$TMPDIR_ISSUES/issue_body_LEV.md"
cat > "$BODY_LEV" <<'EOF'
# Commentaires à compléter/valider — Lévitique (LEV)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #1455 Lévitique 2:1-3
- [ ] #1456 Lévitique 2:8-10

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour LEV…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Lévitique (LEV)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_LEV")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== NBR — Nombres ====
BODY_NBR="$TMPDIR_ISSUES/issue_body_NBR.md"
cat > "$BODY_NBR" <<'EOF'
# Commentaires à compléter/valider — Nombres (NBR)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #1948 Nombres 2:1
- [ ] #1949 Nombres 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour NBR…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Nombres (NBR)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_NBR")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== DEU — Deutéronome ====
BODY_DEU="$TMPDIR_ISSUES/issue_body_DEU.md"
cat > "$BODY_DEU" <<'EOF'
# Commentaires à compléter/valider — Deutéronome (DEU)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #2705 Deutéronome 3:1
- [ ] #2706 Deutéronome 3:2-3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour DEU…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Deutéronome (DEU)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_DEU")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JOS — Josué ====
BODY_JOS="$TMPDIR_ISSUES/issue_body_JOS.md"
cat > "$BODY_JOS" <<'EOF'
# Commentaires à compléter/valider — Josué (JOS)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #3340 Josué 2:2
- [ ] #3341 Josué 2:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JOS…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Josué (JOS)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JOS")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JDG — Juges ====
BODY_JDG="$TMPDIR_ISSUES/issue_body_JDG.md"
cat > "$BODY_JDG" <<'EOF'
# Commentaires à compléter/valider — Juges (JDG)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #3707 Juges 1:1
- [ ] #3708 Juges 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JDG…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Juges (JDG)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JDG")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== RUT — Ruth ====
BODY_RUT="$TMPDIR_ISSUES/issue_body_RUT.md"
cat > "$BODY_RUT" <<'EOF'
# Commentaires à compléter/valider — Ruth (RUT)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #4049 Ruth 1:1
- [ ] #4050 Ruth 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour RUT…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Ruth (RUT)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_RUT")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 1SA — 1 Samuel ====
BODY_1SA="$TMPDIR_ISSUES/issue_body_1SA.md"
cat > "$BODY_1SA" <<'EOF'
# Commentaires à compléter/valider — 1 Samuel (1SA)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #4096 1 Samuel 1:2
- [ ] #4097 1 Samuel 1:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 1SA…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 1 Samuel (1SA)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_1SA")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 2SA — 2 Samuel ====
BODY_2SA="$TMPDIR_ISSUES/issue_body_2SA.md"
cat > "$BODY_2SA" <<'EOF'
# Commentaires à compléter/valider — 2 Samuel (2SA)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #4538 2 Samuel 2:1
- [ ] #4539 2 Samuel 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 2SA…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 2 Samuel (2SA)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_2SA")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 1KI — 1 Rois ====
BODY_1KI="$TMPDIR_ISSUES/issue_body_1KI.md"
cat > "$BODY_1KI" <<'EOF'
# Commentaires à compléter/valider — 1 Rois (1KI)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #4928 1 Rois 2:1
- [ ] #4929 1 Rois 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 1KI…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 1 Rois (1KI)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_1KI")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 2KI — 2 Rois ====
BODY_2KI="$TMPDIR_ISSUES/issue_body_2KI.md"
cat > "$BODY_2KI" <<'EOF'
# Commentaires à compléter/valider — 2 Rois (2KI)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #5444 2 Rois 3:1
- [ ] #5445 2 Rois 3:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 2KI…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 2 Rois (2KI)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_2KI")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 1CH — 1 Chroniques ====
BODY_1CH="$TMPDIR_ISSUES/issue_body_1CH.md"
cat > "$BODY_1CH" <<'EOF'
# Commentaires à compléter/valider — 1 Chroniques (1CH)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #5969 1 Chroniques 2:3
- [ ] #5970 1 Chroniques 2:13

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 1CH…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 1 Chroniques (1CH)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_1CH")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 2CH — 2 Chroniques ====
BODY_2CH="$TMPDIR_ISSUES/issue_body_2CH.md"
cat > "$BODY_2CH" <<'EOF'
# Commentaires à compléter/valider — 2 Chroniques (2CH)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #6333 2 Chroniques 1:1
- [ ] #6334 2 Chroniques 1:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 2CH…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 2 Chroniques (2CH)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_2CH")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== EZR — Esdras ====
BODY_EZR="$TMPDIR_ISSUES/issue_body_EZR.md"
cat > "$BODY_EZR" <<'EOF'
# Commentaires à compléter/valider — Esdras (EZR)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #6907 Esdras 3:1
- [ ] #6908 Esdras 3:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour EZR…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Esdras (EZR)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_EZR")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== NEH — Néhémie ====
BODY_NEH="$TMPDIR_ISSUES/issue_body_NEH.md"
cat > "$BODY_NEH" <<'EOF'
# Commentaires à compléter/valider — Néhémie (NEH)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #7051 Néhémie 2:1-2
- [ ] #7052 Néhémie 2:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour NEH…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Néhémie (NEH)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_NEH")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== EST — Esther ====
BODY_EST="$TMPDIR_ISSUES/issue_body_EST.md"
cat > "$BODY_EST" <<'EOF'
# Commentaires à compléter/valider — Esther (EST)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #7213 Esther 3:1-3
- [ ] #7214 Esther 3:7

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour EST…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Esther (EST)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_EST")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JOB — Job ====
BODY_JOB="$TMPDIR_ISSUES/issue_body_JOB.md"
cat > "$BODY_JOB" <<'EOF'
# Commentaires à compléter/valider — Job (JOB)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #7314 Job 2:1
- [ ] #7315 Job 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JOB…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Job (JOB)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JOB")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== PSA — Psaumes ====
BODY_PSA="$TMPDIR_ISSUES/issue_body_PSA.md"
cat > "$BODY_PSA" <<'EOF'
# Commentaires à compléter/valider — Psaumes (PSA)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #7715 Psaumes 4:1
- [ ] #7716 Psaumes 4:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour PSA…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Psaumes (PSA)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_PSA")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== ECC — Ecclésiaste ====
BODY_ECC="$TMPDIR_ISSUES/issue_body_ECC.md"
cat > "$BODY_ECC" <<'EOF'
# Commentaires à compléter/valider — Ecclésiaste (ECC)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #9178 Ecclésiaste 1:1
- [ ] #9179 Ecclésiaste 1:4

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour ECC…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Ecclésiaste (ECC)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_ECC")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== PRO — Proverbes ====
BODY_PRO="$TMPDIR_ISSUES/issue_body_PRO.md"
cat > "$BODY_PRO" <<'EOF'
# Commentaires à compléter/valider — Proverbes (PRO)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #9264 Proverbes 2:3
- [ ] #9265 Proverbes 2:5-6

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour PRO…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Proverbes (PRO)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_PRO")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== ISA — Ésaïe ====
BODY_ISA="$TMPDIR_ISSUES/issue_body_ISA.md"
cat > "$BODY_ISA" <<'EOF'
# Commentaires à compléter/valider — Ésaïe (ISA)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #9695 Ésaïe 1:1
- [ ] #9696 Ésaïe 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour ISA…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Ésaïe (ISA)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_ISA")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== SNG — Cantique des Cantiques ====
BODY_SNG="$TMPDIR_ISSUES/issue_body_SNG.md"
cat > "$BODY_SNG" <<'EOF'
# Commentaires à compléter/valider — Cantique des Cantiques (SNG)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #9721 Cantique des Cantiques 3:9
- [ ] #9722 Cantique des Cantiques 3:11

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour SNG…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Cantique des Cantiques (SNG)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_SNG")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JER — Jérémie ====
BODY_JER="$TMPDIR_ISSUES/issue_body_JER.md"
cat > "$BODY_JER" <<'EOF'
# Commentaires à compléter/valider — Jérémie (JER)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #10580 Jérémie 2:1
- [ ] #10581 Jérémie 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JER…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Jérémie (JER)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JER")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== LAM — Lamentations de Jérémie ====
BODY_LAM="$TMPDIR_ISSUES/issue_body_LAM.md"
cat > "$BODY_LAM" <<'EOF'
# Commentaires à compléter/valider — Lamentations de Jérémie (LAM)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #11538 Lamentations de Jérémie 1:1
- [ ] #11539 Lamentations de Jérémie 1:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour LAM…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Lamentations de Jérémie (LAM)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_LAM")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== EZK — Ézéchiel ====
BODY_EZK="$TMPDIR_ISSUES/issue_body_EZK.md"
cat > "$BODY_EZK" <<'EOF'
# Commentaires à compléter/valider — Ézéchiel (EZK)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #11628 Ézéchiel 2:3
- [ ] #11629 Ézéchiel 2:4

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour EZK…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Ézéchiel (EZK)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_EZK")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== DAN — Daniel ====
BODY_DAN="$TMPDIR_ISSUES/issue_body_DAN.md"
cat > "$BODY_DAN" <<'EOF'
# Commentaires à compléter/valider — Daniel (DAN)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #12418 Daniel 2:2
- [ ] #12419 Daniel 2:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour DAN…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Daniel (DAN)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_DAN")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== HOS — Osée ====
BODY_HOS="$TMPDIR_ISSUES/issue_body_HOS.md"
cat > "$BODY_HOS" <<'EOF'
# Commentaires à compléter/valider — Osée (HOS)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #12641 Osée 1:1
- [ ] #12642 Osée 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour HOS…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Osée (HOS)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_HOS")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JOL — Joël ====
BODY_JOL="$TMPDIR_ISSUES/issue_body_JOL.md"
cat > "$BODY_JOL" <<'EOF'
# Commentaires à compléter/valider — Joël (JOL)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #12767 Joël 2:1
- [ ] #12768 Joël 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JOL…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Joël (JOL)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JOL")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== AMO — Amos ====
BODY_AMO="$TMPDIR_ISSUES/issue_body_AMO.md"
cat > "$BODY_AMO" <<'EOF'
# Commentaires à compléter/valider — Amos (AMO)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #12810 Amos 1:1
- [ ] #12811 Amos 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour AMO…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Amos (AMO)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_AMO")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== OBA — Abdias ====
BODY_OBA="$TMPDIR_ISSUES/issue_body_OBA.md"
cat > "$BODY_OBA" <<'EOF'
# Commentaires à compléter/valider — Abdias (OBA)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #12916 Abdias 1:1
- [ ] #12917 Abdias 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour OBA…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Abdias (OBA)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_OBA")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JON — Jonas ====
BODY_JON="$TMPDIR_ISSUES/issue_body_JON.md"
cat > "$BODY_JON" <<'EOF'
# Commentaires à compléter/valider — Jonas (JON)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #12928 Jonas 1:1
- [ ] #12929 Jonas 1:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JON…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Jonas (JON)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JON")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== MIC — Michée ====
BODY_MIC="$TMPDIR_ISSUES/issue_body_MIC.md"
cat > "$BODY_MIC" <<'EOF'
# Commentaires à compléter/valider — Michée (MIC)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #12960 Michée 3:1
- [ ] #12961 Michée 3:4

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour MIC…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Michée (MIC)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_MIC")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== NAM — Nahum ====
BODY_NAM="$TMPDIR_ISSUES/issue_body_NAM.md"
cat > "$BODY_NAM" <<'EOF'
# Commentaires à compléter/valider — Nahum (NAM)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #13030 Nahum 2:1
- [ ] #13031 Nahum 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour NAM…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Nahum (NAM)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_NAM")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== HAB — Habacuc ====
BODY_HAB="$TMPDIR_ISSUES/issue_body_HAB.md"
cat > "$BODY_HAB" <<'EOF'
# Commentaires à compléter/valider — Habacuc (HAB)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #13056 Habacuc 1:1
- [ ] #13057 Habacuc 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour HAB…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Habacuc (HAB)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_HAB")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== ZEP — Sophonie ====
BODY_ZEP="$TMPDIR_ISSUES/issue_body_ZEP.md"
cat > "$BODY_ZEP" <<'EOF'
# Commentaires à compléter/valider — Sophonie (ZEP)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #13095 Sophonie 2:2-3
- [ ] #13096 Sophonie 2:5

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour ZEP…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Sophonie (ZEP)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_ZEP")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== HAG — Aggée ====
BODY_HAG="$TMPDIR_ISSUES/issue_body_HAG.md"
cat > "$BODY_HAG" <<'EOF'
# Commentaires à compléter/valider — Aggée (HAG)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #13130 Aggée 2:1
- [ ] #13131 Aggée 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour HAG…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Aggée (HAG)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_HAG")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== ZEC — Zacharie ====
BODY_ZEC="$TMPDIR_ISSUES/issue_body_ZEC.md"
cat > "$BODY_ZEC" <<'EOF'
# Commentaires à compléter/valider — Zacharie (ZEC)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #13158 Zacharie 2:4
- [ ] #13159 Zacharie 2:5

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour ZEC…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Zacharie (ZEC)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_ZEC")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== MAL — Malachie ====
BODY_MAL="$TMPDIR_ISSUES/issue_body_MAL.md"
cat > "$BODY_MAL" <<'EOF'
# Commentaires à compléter/valider — Malachie (MAL)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #13309 Malachie 1:1
- [ ] #13310 Malachie 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour MAL…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Malachie (MAL)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_MAL")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== MAT — Matthieu ====
BODY_MAT="$TMPDIR_ISSUES/issue_body_MAT.md"
cat > "$BODY_MAT" <<'EOF'
# Commentaires à compléter/valider — Matthieu (MAT)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #13353 Matthieu 2:1
- [ ] #13354 Matthieu 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour MAT…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Matthieu (MAT)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_MAT")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== MRK — Marc ====
BODY_MRK="$TMPDIR_ISSUES/issue_body_MRK.md"
cat > "$BODY_MRK" <<'EOF'
# Commentaires à compléter/valider — Marc (MRK)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #13866 Marc 2:5
- [ ] #13867 Marc 2:7

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour MRK…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Marc (MRK)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_MRK")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== LUK — Luc ====
BODY_LUK="$TMPDIR_ISSUES/issue_body_LUK.md"
cat > "$BODY_LUK" <<'EOF'
# Commentaires à compléter/valider — Luc (LUK)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #14151 Luc 1:2
- [ ] #14152 Luc 1:5

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour LUK…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Luc (LUK)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_LUK")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JHN — Jean ====
BODY_JHN="$TMPDIR_ISSUES/issue_body_JHN.md"
cat > "$BODY_JHN" <<'EOF'
# Commentaires à compléter/valider — Jean (JHN)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #14673 Jean 3:3
- [ ] #14674 Jean 3:5

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JHN…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Jean (JHN)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JHN")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== ACT — Actes des Apôtres ====
BODY_ACT="$TMPDIR_ISSUES/issue_body_ACT.md"
cat > "$BODY_ACT" <<'EOF'
# Commentaires à compléter/valider — Actes des Apôtres (ACT)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #15083 Actes des Apôtres 1:1-2
- [ ] #15084 Actes des Apôtres 1:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour ACT…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Actes des Apôtres (ACT)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_ACT")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== ROM — Romains ====
BODY_ROM="$TMPDIR_ISSUES/issue_body_ROM.md"
cat > "$BODY_ROM" <<'EOF'
# Commentaires à compléter/valider — Romains (ROM)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #15622 Romains 1:1
- [ ] #15623 Romains 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour ROM…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Romains (ROM)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_ROM")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 1CO — 1 Corinthiens ====
BODY_1CO="$TMPDIR_ISSUES/issue_body_1CO.md"
cat > "$BODY_1CO" <<'EOF'
# Commentaires à compléter/valider — 1 Corinthiens (1CO)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #15915 1 Corinthiens 2:1
- [ ] #15916 1 Corinthiens 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 1CO…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 1 Corinthiens (1CO)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_1CO")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 2CO — 2 Corinthiens ====
BODY_2CO="$TMPDIR_ISSUES/issue_body_2CO.md"
cat > "$BODY_2CO" <<'EOF'
# Commentaires à compléter/valider — 2 Corinthiens (2CO)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16152 2 Corinthiens 2:4
- [ ] #16153 2 Corinthiens 2:7

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 2CO…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 2 Corinthiens (2CO)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_2CO")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== GAL — Galates ====
BODY_GAL="$TMPDIR_ISSUES/issue_body_GAL.md"
cat > "$BODY_GAL" <<'EOF'
# Commentaires à compléter/valider — Galates (GAL)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16305 Galates 1:1
- [ ] #16306 Galates 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour GAL…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Galates (GAL)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_GAL")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== EPH — Éphésiens ====
BODY_EPH="$TMPDIR_ISSUES/issue_body_EPH.md"
cat > "$BODY_EPH" <<'EOF'
# Commentaires à compléter/valider — Éphésiens (EPH)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16405 Éphésiens 1:1
- [ ] #16406 Éphésiens 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour EPH…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Éphésiens (EPH)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_EPH")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== PHP — Philippiens ====
BODY_PHP="$TMPDIR_ISSUES/issue_body_PHP.md"
cat > "$BODY_PHP" <<'EOF'
# Commentaires à compléter/valider — Philippiens (PHP)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16520 Philippiens 2:1
- [ ] #16521 Philippiens 2:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour PHP…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Philippiens (PHP)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_PHP")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 1TH — 1 Thessaloniciens ====
BODY_1TH="$TMPDIR_ISSUES/issue_body_1TH.md"
cat > "$BODY_1TH" <<'EOF'
# Commentaires à compléter/valider — 1 Thessaloniciens (1TH)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16596 1 Thessaloniciens 1:1
- [ ] #16597 1 Thessaloniciens 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 1TH…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 1 Thessaloniciens (1TH)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_1TH")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== COL — Colossiens ====
BODY_COL="$TMPDIR_ISSUES/issue_body_COL.md"
cat > "$BODY_COL" <<'EOF'
# Commentaires à compléter/valider — Colossiens (COL)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16657 Colossiens 1:1
- [ ] #16658 Colossiens 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour COL…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Colossiens (COL)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_COL")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 2TH — 2 Thessaloniciens ====
BODY_2TH="$TMPDIR_ISSUES/issue_body_2TH.md"
cat > "$BODY_2TH" <<'EOF'
# Commentaires à compléter/valider — 2 Thessaloniciens (2TH)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16723 2 Thessaloniciens 1:1
- [ ] #16724 2 Thessaloniciens 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 2TH…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 2 Thessaloniciens (2TH)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_2TH")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 1TI — 1 Timothée ====
BODY_1TI="$TMPDIR_ISSUES/issue_body_1TI.md"
cat > "$BODY_1TI" <<'EOF'
# Commentaires à compléter/valider — 1 Timothée (1TI)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16759 1 Timothée 2:1
- [ ] #16760 1 Timothée 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 1TI…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 1 Timothée (1TI)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_1TI")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 2TI — 2 Timothée ====
BODY_2TI="$TMPDIR_ISSUES/issue_body_2TI.md"
cat > "$BODY_2TI" <<'EOF'
# Commentaires à compléter/valider — 2 Timothée (2TI)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16829 2 Timothée 1:1
- [ ] #16830 2 Timothée 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 2TI…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 2 Timothée (2TI)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_2TI")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== TIT — Tite ====
BODY_TIT="$TMPDIR_ISSUES/issue_body_TIT.md"
cat > "$BODY_TIT" <<'EOF'
# Commentaires à compléter/valider — Tite (TIT)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16877 Tite 2:2
- [ ] #16878 Tite 2:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour TIT…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Tite (TIT)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_TIT")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== PHM — Philémon ====
BODY_PHM="$TMPDIR_ISSUES/issue_body_PHM.md"
cat > "$BODY_PHM" <<'EOF'
# Commentaires à compléter/valider — Philémon (PHM)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16902 Philémon 1:1
- [ ] #16903 Philémon 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour PHM…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Philémon (PHM)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_PHM")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== HEB — Hébreux ====
BODY_HEB="$TMPDIR_ISSUES/issue_body_HEB.md"
cat > "$BODY_HEB" <<'EOF'
# Commentaires à compléter/valider — Hébreux (HEB)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #16919 Hébreux 1:1
- [ ] #16920 Hébreux 1:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour HEB…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Hébreux (HEB)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_HEB")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JAS — Jacques ====
BODY_JAS="$TMPDIR_ISSUES/issue_body_JAS.md"
cat > "$BODY_JAS" <<'EOF'
# Commentaires à compléter/valider — Jacques (JAS)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #17116 Jacques 2:1
- [ ] #17117 Jacques 2:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JAS…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Jacques (JAS)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JAS")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 1PE — 1 Pierre ====
BODY_1PE="$TMPDIR_ISSUES/issue_body_1PE.md"
cat > "$BODY_1PE" <<'EOF'
# Commentaires à compléter/valider — 1 Pierre (1PE)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #17181 1 Pierre 1:1
- [ ] #17182 1 Pierre 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 1PE…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 1 Pierre (1PE)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_1PE")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 2PE — 2 Pierre ====
BODY_2PE="$TMPDIR_ISSUES/issue_body_2PE.md"
cat > "$BODY_2PE" <<'EOF'
# Commentaires à compléter/valider — 2 Pierre (2PE)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #17252 2 Pierre 2:1
- [ ] #17253 2 Pierre 2:4

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 2PE…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 2 Pierre (2PE)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_2PE")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 1JN — 1 Jean ====
BODY_1JN="$TMPDIR_ISSUES/issue_body_1JN.md"
cat > "$BODY_1JN" <<'EOF'
# Commentaires à compléter/valider — 1 Jean (1JN)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #17295 1 Jean 2:1
- [ ] #17296 1 Jean 2:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 1JN…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 1 Jean (1JN)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_1JN")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 2JN — 2 Jean ====
BODY_2JN="$TMPDIR_ISSUES/issue_body_2JN.md"
cat > "$BODY_2JN" <<'EOF'
# Commentaires à compléter/valider — 2 Jean (2JN)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #17361 2 Jean 1:1
- [ ] #17362 2 Jean 1:3

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 2JN…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 2 Jean (2JN)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_2JN")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== 3JN — 3 Jean ====
BODY_3JN="$TMPDIR_ISSUES/issue_body_3JN.md"
cat > "$BODY_3JN" <<'EOF'
# Commentaires à compléter/valider — 3 Jean (3JN)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #17369 3 Jean 1:3
- [ ] #17370 3 Jean 1:4

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour 3JN…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — 3 Jean (3JN)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_3JN")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== JUD — Jude ====
BODY_JUD="$TMPDIR_ISSUES/issue_body_JUD.md"
cat > "$BODY_JUD" <<'EOF'
# Commentaires à compléter/valider — Jude (JUD)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #17377 Jude 1:1
- [ ] #17378 Jude 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour JUD…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Jude (JUD)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_JUD")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

# ==== REV — Apocalypse ====
BODY_REV="$TMPDIR_ISSUES/issue_body_REV.md"
cat > "$BODY_REV" <<'EOF'
# Commentaires à compléter/valider — Apocalypse (REV)

> Sélection des 2 premiers commentaires non approuvés pour ce livre.

- [ ] #17398 Apocalypse 1:1
- [ ] #17399 Apocalypse 1:2

_Auto-généré par make_commentary_issues_commands.js_
EOF

echo "Création de l'issue pour REV…"
gh api "repos/$REPO/issues" -X POST \
  -f title='Forge — Commentaires à valider — Apocalypse (REV)' \
  -f milestone="$MST_NUMBER" \
  -f labels[]='commentaries' \
  -f labels[]='forge' \
  -f body="$(cat "$BODY_REV")" \
  --jq '.html_url'
sleep "$DELAY_SEC"

echo "✅ Terminé."