import * as ReadingService from '../../resources/js/readingService.js';
import * as ToolService from '../../resources/js/toolsService.js';

$(document).ready(() => {
    initProgram().then(() => {
        $('.chapter').on('click', function (e) { chapter_clicked(e); })
    });

    initBible();
});

const initBible = () => {
    var chapters = ToolService.Build()

    console.log(chapters);
}

const chapter_clicked = (e) => {
    var reading = $(e.target);
    console.log(ReadingService.find_book(reading.attr('data-book'), reading.attr('data-chapter')));
}

const buildOldTestament = (readings) => {
    var result = '';

    readings.filter(e => e != '').forEach(rdg => {
        var keys = rdg.split(' ');
        result += div_rdg_old.replace('{rdg_book}', rdg)
            .replace('{book}', keys[0])
            .replace('{chapter}', keys[1]);
    })

    return result;
}


const buildNewTestament = (readings) => {
    var result = '';

    readings.filter(e => e != '').forEach(rdg => {
        var keys = rdg.split(' ');
        result += div_rdg_new.replace('{rdg_book}', rdg)
            .replace('{book}', keys[0])
            .replace('{chapter}', keys[1]);
    })

    return result;
}

const builCard = (rdg) => {
    // console.log(rdg);
    var div = div_rdgBox.replace('{rdg_day}', rdg.day)
    .replace('{rdg_books}', buildOldTestament(rdg.old) + buildNewTestament(rdg.new));

    return div;
}

const getProgram = () => {
    return new Promise((res, rej) => {
        var data = ReadingService.get()
            .sort((a, b) => a.day > b.day);

        res(data);
    });
}

const initProgram = () => {

    return getProgram().then(rdgs => {
        rdgs.forEach(rdg => {
            var div = builCard(rdg);
            $(`#boxes`).append(div);
        });
    });
}

const div_rdgBox = `
                <div class="box">
                    <div class="day">{rdg_day}/180</div>
                    <div class="readings">
                        {rdg_books}
                    </div>
                </div>`;


const div_rdg_old = `<div class="reading"><div class="progress"><i class="fa-solid fa-circle"></i></div><div class="chapter" data-book="{book}" data-chapter = "{chapter}">{rdg_book}</div></div>`;
const div_rdg_new = `<div class="reading"><div class="progress"><i class="fa-solid fa-circle new_testament_book"></i></div><div class="chapter" data-book="{book}" data-chapter = "{chapter}">{rdg_book}</div></div>`;