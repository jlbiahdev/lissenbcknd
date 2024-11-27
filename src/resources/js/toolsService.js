import * as BibleIndexDb from '../../data/bible/index.js';

export const get = () => {
    var items = BibleIndexDb.data;

    return items;
}


export const Build = () => {
    var bible = get();
    var result = [];

    bible.forEach(bk => {
        bk.chapters.forEach(chapter => {
            var count = 0;
            var book = {
                id: bk.book,
                chapter: chapter.index,
                verses: []
            }

            while(count < chapter.verses) {
                book.verses.push({
                    verse: count++,
                    text: ``,
                    footnote: ``
                });
            }
            result.push(book);
        });
    })

    return result;
}