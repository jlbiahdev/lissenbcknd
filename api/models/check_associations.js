// api/models/check_associations.js
/* eslint-disable no-console */

const {
  sequelize,
  Bible,
  Testament,
  Book,
  Chapter,
  Verse,
  Theme,
  VerseTheme,
  Meditation,
  MeditationVerse,
} = require('./index'); // ← ajuste le chemin si besoin

async function main() {
  try {
    console.log('🔌 Connecting to DB…');
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // 1) Un verset → chapitre → livre + thèmes
    const oneVerse = await Verse.findOne({
      include: [
        { model: Chapter, as: 'chapter', include: [{ model: Book, as: 'book' }] },
        { model: Theme, as: 'themes', through: { attributes: [] } },
      ],
      order: [['id', 'ASC']],
    });

    if (!oneVerse) {
      console.log('⚠️ Aucun verset trouvé.');
    } else {
      console.log('📌 Verse ID:', oneVerse.id, 'num:', oneVerse.number);
      console.log('   Book:', oneVerse.chapter?.book?.name, '| Chapter:', oneVerse.chapter?.number);
      console.log('   Themes:', (oneVerse.themes || []).map(t => t.name));
    }

    // 2) Un livre → chapitres → versets (compte)
    const oneBook = await Book.findOne({
      include: [{ model: Chapter, as: 'chapters', include: [{ model: Verse, as: 'verses' }] }],
      order: [['id', 'ASC']],
    });

    if (!oneBook) {
      console.log('⚠️ Aucun livre trouvé.');
    } else {
      const firstChapter = oneBook.chapters?.[0];
      console.log('📚 Book:', oneBook.name, '| Chapters:', oneBook.chapters?.length || 0);
      console.log('   First chapter #', firstChapter?.number, 'verses:', firstChapter?.verses?.length || 0);
    }

    // 3) Une méditation → versets liés
    const oneMeditation = await Meditation.findOne({
      include: [{ model: Verse, as: 'verses', through: { attributes: [] } }],
      order: [['id', 'ASC']],
    });

    if (!oneMeditation) {
      console.log('⚠️ Aucune méditation trouvée.');
    } else {
      console.log('🧘 Meditation ID:', oneMeditation.id, '| Verses linked:', oneMeditation.verses?.length || 0);
    }

    // 4) Vérifier l’accès via le pivot VerseTheme (existe et FK OK)
    const vt = await VerseTheme.findOne();
    if (!vt) {
      console.log('ℹ️ Table verse_themes vide ou non peuplée (OK si pas encore mappé).');
    } else {
      console.log('🔗 Sample verse_themes row:', { verse_id: vt.verse_id, theme_id: vt.theme_id });
    }

  } catch (err) {
    console.error('❌ Error:', err?.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
    console.log('👋 Closed DB connection.');
  }
}

main();
