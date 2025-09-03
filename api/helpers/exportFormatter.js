function formatToExport(meditations) {
  return meditations.map(meditation => {
    const verse = meditation.verse;

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

function formatToView(data) {
  return {
    themes: data.themes || [],
    commentary: {
      id: data.id,
      title: data.title || "",
      text: data.text || "",
      approved: data.approved || false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt ?? null,
    },
    verses: data.verses ? data.verses.map(v => ({
      id: v.id,
      bookId: v.chapter.book.id,
      chapterNum: v.chapter.number,
      verseNum: v.number,
      text: v.text,
      refs: v.refs || [],
    })) : []
  };
}

module.exports = {
  formatToExport,
  formatToView
};
