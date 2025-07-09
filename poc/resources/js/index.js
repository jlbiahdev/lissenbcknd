import * as Bible from '../../data/bible/lsg1910.js';

const bible = Bible.data;

$(document).ready(() => {

    // initProgram().then(() => {
    //     $('.chapter').on('click', function (e) { chapter_clicked(e); })
    // });
	
	// adapt();
    // init();
    // initBible();
    // extractVerses();
    initFiltering();
});

 const initFiltering = () => {
    const themes = [
      "Création et puissance de Dieu",
      "Confiance en Dieu",
      "Paix intérieure",
      "Direction divine",
      "Amour de Dieu",
      "Espérance",
      "Repentance"
    ];

    const testamentSelect = document.getElementById('testamentSelect');
    const bookSelect = document.getElementById('bookSelect');
    const chapterSelect = document.getElementById('chapterSelect');
    const app = document.getElementById('app');

    function populateSelect(select, items, defaultOption = '-- Choisir --') {
      select.innerHTML = `<option value="">${defaultOption}</option>`;
      items.forEach((item, i) => {
        const option = document.createElement('option');
        option.value = item.id || item.number;
        option.textContent = item.name || item.number;
        select.appendChild(option);
      });
    }

    document.getElementById('btn-export').addEventListener('click', () => {
        exportJSON();
    });

    testamentSelect.addEventListener('change', () => {
        console.log('Testament selected:', testamentSelect.value);
        const books = bible.testaments.find(e => e.id === Number(testamentSelect.value))?.books || [];
        populateSelect(bookSelect, books);
        chapterSelect.innerHTML = '<option value="">-- Choisir --</option>';
        app.innerHTML = '';
    });

    bookSelect.addEventListener('change', () => {
      const chapters = bible.testaments.find(e => e.id === Number(testamentSelect.value))?.books.find(e => e.id === Number(bookSelect.value))?.chapters || [];
      populateSelect(chapterSelect, chapters, '-- Chapitre --');
      app.innerHTML = '';
    });

    chapterSelect.addEventListener('change', () => {
        const selectedBookText = bookSelect.options[bookSelect.selectedIndex].text;
        const filter = `${selectedBookText} ${chapterSelect.value}:`;
        console.log('selected verses:', filter);
        const verses = bible.testaments.find(e => e.id === Number(testamentSelect.value))?.books.find(e => e.id === Number(bookSelect.value))?.chapters.find(e => e.number === Number(chapterSelect.value))?.verses || []; // (e => e.ref.includes(filter)) || [];
        console.log('Filtered verses:', verses);
        renderVerses(verses);
    });

    function renderVerses(verses) {
      app.innerHTML = '';
      verses.forEach((verse) => {
        const box = document.createElement('div');
        box.className = 'verse-box';
        if (verse.themes && verse.themes.length > 0) {
          box.classList.add('tagged');
        }

        const ref = document.createElement('h3');
        ref.textContent = verse.ref;
        box.appendChild(ref);

        const text = document.createElement('p');
        text.textContent = verse.text;
        box.appendChild(text);

        const checkboxes = document.createElement('div');
        checkboxes.className = 'themes';

        themes.forEach(theme => {
          const label = document.createElement('label');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = verse.themes?.includes(theme);
          checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                if (!verse.themes) {
                  verse.themes = [];
                }
              verse.themes.push(theme);
            } else {
              verse.themes = verse.themes.filter(t => t !== theme);
            }
            if (verse.themes?.length > 0) {
              box.classList.add('tagged');
            } else {
              box.classList.remove('tagged');
            }
          });
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(' ' + theme));
          checkboxes.appendChild(label);
        });

        box.appendChild(checkboxes);

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Sauvegarder';
        saveBtn.addEventListener('click', () => {
          console.log('✅', verse.ref, verse.themes);
          alert(`Thèmes pour ${verse.ref} :\n${verse.themes.join(', ')}`);
        });

        box.appendChild(saveBtn);
        app.appendChild(box);
      });
    }

    populateSelect(testamentSelect, bible.testaments);
 }

const adapt = () => {
    console.log('init', Bible);
    const bible = {
        testaments: []
    };

    let testament_count = 1;
    Bible.data.Testaments.forEach(testament => {
        let books_count = 1;
        const new_testament = {
            id: testament_count++,
            name: testament.Text,
            books: [],
        };
        testament.Books.forEach(book => {
            const new_book = {
                id: books_count++,
                name: book.Text,
                chapters: []
            }

            new_testament.books.push(new_book);
            let chapter_count = 1;
            book.Chapters.forEach(chapter => {
                const new_chapter = {
                    number: chapter_count++,
                    verses: []
                };
                new_book.chapters.push(new_chapter);
                let verse_count = 1;
                chapter.Verses.forEach(verse => {
                    const new_verse = {
                        id: verse_count++,
                        text: verse.Text
                    };
                    new_chapter.verses.push(new_verse);
                });
            });
        });
        bible.testaments.push(new_testament);
        console.log(testament);
    });

    console.log(bible);
}

const extractVerses = () => {
    const verses = [];
    let verseCount = 1;
    Bible.data.testaments.forEach(testament => {
        testament.books.forEach(book => {
            book.chapters.forEach(chapter => {
                chapter.verses.forEach(verse => {
                    if (verse.meditative) {
                        verses.push({
                            id: verseCount++,
                            ref: verse.ref,
                            text: verse.text,
                            themes: verse.themes,
                            testament: testament.name,
                            book: book.name,
                        });
                    }
                });
            });
        });
    });

    console.log('Extracted verses:', verses);

    return verses;
}

const init = () => {
    console.log(Bible.data.testaments);
// tag_bible_multi.js

const themes = {
  "Création et puissance de Dieu": ["créa", "création", "lumière", "Dieu dit"],
  "Confiance en Dieu": ["confiance", "ne crains", "je suis avec toi"],
  "Paix intérieure": ["paix", "repos", "calme"],
  "Direction divine": ["voie", "guide", "chemin", "sentier"],
  "Amour de Dieu": ["amour", "bonté", "miséricorde"],
  "Espérance": ["espérance", "promesse", "avenir", "salut"],
  "Repentance": ["péché", "pardon", "repens", "cœur"]
};

function tagVerse(verse) {
  const foundThemes = [];

  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(k => verse.text.toLowerCase().includes(k))) {
      foundThemes.push(theme);
    }
  }

  if (foundThemes.length > 0) {
    verse.meditative = true;
    verse.themes = foundThemes;
  }
}

for (const testament of Bible.data.testaments) {
  for (const book of testament.books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        if (verse.text) tagVerse(verse);
      }
    }
  }
    console.log(testament);
}

// fs.writeFileSync('./bible_lsg_tagged.json', JSON.stringify(Bible, null, 2), 'utf8');
console.log('✅ Fichier généré avec thèmes multiples : bible_lsg_tagged.json', Bible);
}

const initBible = () => {
    console.log('Bible data:', Bible.data);
    Bible.data.testaments.forEach(testament => {
        testament.books.forEach(book => {
            book.chapters.forEach(chapter => {
                chapter.verses.forEach(verse => {
                    verse.ref = `${book.name} ${chapter.number}:${verse.id}`;
                });
            });
        });
    });
}

// 🔽 Ajout fonction d'export JSON pour sauvegarder le travail manuellement
export function exportJSON() {
    const dataStr = JSON.stringify(bible, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bible_tagged.json";
    a.click();
    URL.revokeObjectURL(url);
}
