function formatToExport(meditations) {
  return meditations.map(meditation => {
    const verse = meditation.verse;

    // console.log('meditation.verse:', meditation.verse);
    // console.log('meditation.Themes:', meditation.Themes);
    // console.log('verse.Book', verse.Book);
    return {
      id: verse.id,
      ref: `${verse.Book.name} ${verse.chapterNum}:${verse.verseNum}`,
      text: verse.text,
      themes: meditation.themes || [],
      testament: verse.Book.testament === 'old' ? 'Ancien Testament' : 'Nouveau Testament',
      book: verse.Book.name
    };
  });
}

function formatToView(meditation) {
  const verse = meditation.verse || {};
  return {
    themes: meditation.themes || [],
    commentary: {
      text: meditation.commentary || "",
      approved: meditation.commentApproved || false
    },
    verse: {
      id: verse.id,
      bookId: verse.bookId,
      chapterNum: verse.chapterNum,
      verseNum: verse.verseNum,
      text: verse.text,
      refs: verse.refs || [],
      approved: meditation.verseApproved || false
    }
  };
}

module.exports = {
  formatToExport,
  formatToView
};
