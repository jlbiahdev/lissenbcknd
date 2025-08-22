-- 1. Créer le type ENUM s'il n'existe pas
DO $$
BEGIN
  CREATE TYPE enum_books_testament AS ENUM ('old', 'new');
EXCEPTION
  WHEN duplicate_object THEN null;
END
$$;

CREATE TABLE bibles (
  code TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  edition_year INTEGER
);

-- Table des livres bibliques
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  bible_code TEXT NOT NULL REFERENCES bibles(code),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  testament enum_books_testament NOT NULL
);

-- Table des versets bibliques (par Bible) avec id autoincrémenté
CREATE TABLE verses (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id),
  chapter_number INTEGER NOT NULL,
  number INTEGER NOT NULL,
  text TEXT NOT NULL,
  refs TEXT[]
);

-- Table des versets méditatifs
CREATE TABLE meditative_verses (
  verse_id INTEGER PRIMARY KEY REFERENCES verses(id),
  themes TEXT[],
  commentary TEXT,
  verse_approved BOOLEAN DEFAULT FALSE,
  comment_approved BOOLEAN DEFAULT FALSE
);

-- Table des themes
CREATE TABLE themes (
  name TEXT PRIMARY KEY
);
