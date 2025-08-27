// scripts/importMeditativeVerses.js
const fs = require('fs');
const path = require('path');
const { sequelize, Book, MeditativeVerse, Verse } = require('../models');

async function importMeditativeVerses() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');

    // ---- charger les livres LSG1910 et leurs versets ----
    const books = await Book.findAll({ where: { bibleCode: 'LSG1910' } });
    const bookByName = new Map(
      books.map(b => [String(b.name).toUpperCase(), b])
    );
    const bookIds = books.map(b => b.id);
    const verses = await Verse.findAll({ where: { bookId: bookIds } });

    // index rapide (bookId|chapter|verse) -> Verse
    const verseIndex = new Map(
      verses.map(v => [`${v.bookId}|${v.chapterNum}|${v.verseNum}`, v])
    );

    console.log('✅ Loaded books:', books.length, 'verses:', verses.length);

    // ---------- 1) marquer tous les versets "méditatifs" (création si manquant) ----------
    const fileMeditative = path.join(__dirname, '../data/initial/lsg1910.json');
    const rawMeditative = fs.readFileSync(fileMeditative, 'utf-8');
    const dataMeditative = JSON.parse(rawMeditative);

    let createdBase = 0, touchedBase = 0, missingRefsBase = 0;

    for (const testament of dataMeditative.testaments) {
      for (const book of testament.books) {
        const b = bookByName.get(String(book.name).toUpperCase());
        if (!b) { missingRefsBase++; continue; }

        for (const chapter of book.chapters) {
          for (const v of chapter.verses) {
            if (v.meditative === true) {
              const key = `${b.id}|${chapter.number}|${v.id}`;
              const verseRow = verseIndex.get(key);
              if (!verseRow) { missingRefsBase++; continue; }

              // Crée si absent, sinon ne touche que ce qui est nécessaire
              const [rec, isCreated] = await MeditativeVerse.upsert({
                verseId: verseRow.id,
                // on ne force pas 'commentary' ici; on le posera dans l'étape 2 si dispo
                // IMPORTANT: approved reste false par défaut
                approved: false,
              }, { returning: false });

              if (isCreated) createdBase++; else touchedBase++;
            }
          }
        }
      }
    }
    console.log(`✅ Étape 1 — Sélection "méditatif": créés=${createdBase}, existants=${touchedBase}, refs introuvables=${missingRefsBase}`);

    // ---------- 2) appliquer thèmes + commentaire (reste non approuvé) ----------
    const fileCommented = path.join(__dirname, '../data/lsg1910_verses_commentated.json');
    const rawCommented = fs.readFileSync(fileCommented, 'utf-8');
    const dataCommented = JSON.parse(rawCommented);

    const parseRef = (ref) => {
      const parts = ref.split(' ');
      const chapterVerse = parts.pop();
      return { bookName: parts.join(' '), chapterVerse };
    };

    let created2 = 0, updated2 = 0, missingRefs2 = 0;

    for (const entry of dataCommented) {
      const { bookName, chapterVerse } = parseRef(entry.ref);
      const [chapterStr, verseStr] = String(chapterVerse).split(':');
      const chapterNum = parseInt(chapterStr, 10);
      const verseNum = parseInt(verseStr, 10);

      const b = bookByName.get(String(bookName).toUpperCase());
      if (!b) { missingRefs2++; continue; }

      const verseRow = verseIndex.get(`${b.id}|${chapterNum}|${verseNum}`);
      if (!verseRow) { missingRefs2++; continue; }

      // NOTE: toute modification de "commentary" déclenchera ton trigger:
      // - commentary_updated_at = now()
      // - approved = false
      // donc on fixe explicitement approved=false ici aussi (cohérent)
      const [rec, isCreated] = await MeditativeVerse.findOrCreate({
        where: { verseId: verseRow.id },
        defaults: {
          commentary: entry.commentary ?? null,
          approved: false,
        },
      });

      // si déjà existant, on met à jour commentaire + approuvé
      if (!isCreated) {
        await rec.update({
          commentary: entry.commentary ?? null,
          approved: false
        });
      }
      console.log(`✅ Méditatif verset ${rec.id} ${isCreated ? 'créé' : 'mis à jour'}`, rec.id);
      await rec.setThemes(entry.themes || []);
      if (isCreated) created2++; else updated2++;
    }

    console.log(`✅ Étape 2 — Commentaires: créés=${created2}, mis à jour=${updated2}, refs introuvables=${missingRefs2}`);
    console.log('🎉 Import terminé.');

  } catch (err) {
    console.error('❌ Erreur import:', err);
    process.exit(1);
  }
}

sequelize.sync().then(() => {
  importMeditativeVerses()
    .then(() => { console.log('✅ Done.'); process.exit(0); })
    .catch((err) => { console.error('❌ Erreur lors de l’import:', err); process.exit(1); });
});
