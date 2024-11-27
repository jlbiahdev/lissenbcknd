import * as DbReadings from '../../data/pgm.js';
import * as DbGenesis from '../../data/bible/lsg/1_genese.js';
// import * as DbExodus from '../../data/bible/lsg/1_genese.js';
import * as DbApocalyps from '../../data/bible/lsg/66_apocalypse.js';

export const get = () => {
    var items = DbReadings.data;

    return items;
}

export const find_by_day = (day) => {
    var item = DbReadings.data.find(e => e.day === day);

    return item;
};

export const find_book = (book, chapter) => {
    switch (book) {
        case 'Genèse':
            return DbGenesis.data.find(bk => bk.chapter === Number(chapter));
    
        default:
            return DbApocalyps.data.find(bk => bk.chapter === Number(chapter));
    }
}