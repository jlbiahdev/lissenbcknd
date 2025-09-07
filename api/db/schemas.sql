DROP TABLE IF EXISTS public.verse_themes;
DROP TABLE IF EXISTS public.themes;
DROP TABLE IF EXISTS public.category_themes;
DROP TABLE IF EXISTS public.commentary_verses;
DROP TABLE IF EXISTS public.commentaries;

DROP TABLE IF EXISTS public.verses;
DROP TABLE IF EXISTS public.chapters;
DROP TABLE IF EXISTS public.books;
DROP TABLE IF EXISTS public.testaments;
DROP TABLE IF EXISTS public.bibles;

CREATE TABLE bibles (
  code TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  edition_year INTEGER,

  -- horodatages
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des testaments
CREATE TABLE testaments (
  id SERIAL PRIMARY KEY,
  index INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  bible_code TEXT NOT NULL REFERENCES bibles(code),

  -- horodatages
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, bible_code)
);

-- Table des livres bibliques
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  testament_id INTEGER NOT NULL REFERENCES testaments(id),
  chapters_count INTEGER NOT NULL,

  -- horodatages
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_books_testament_number
ON books(testament_id, number);

-- Table des chapitres
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL,         -- numéro du chapitre dans le livre
    book_id INTEGER NOT NULL REFERENCES books(id),    -- identifiant du livre (book.id)
    verses_count INTEGER NOT NULL,   -- nombre de versets dans le chapitre
   
  -- horodatages
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (number, book_id)
);

-- Table des versets bibliques (par Bible) avec id autoincrémenté
CREATE TABLE verses (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  number INTEGER NOT NULL,
  text TEXT NOT NULL,
  refs TEXT[],

  -- horodatages
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_verse_chapter_number ON verses(chapter_id, number);

-- Table des category_themes
CREATE TABLE category_themes (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] NOT NULL,

  -- horodatages
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- Table des themes
CREATE TABLE themes (
  id BIGINT PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES category_themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,

  -- horodatages
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name)
);

CREATE TABLE verse_themes (
  verse_id BIGINT REFERENCES verses(id) ON DELETE CASCADE,
  theme_id INT REFERENCES themes(id) ON DELETE CASCADE,

  -- horodatages
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (verse_id, theme_id)
);

-- Table des commentaires bibliques
CREATE TABLE commentaries (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  text         TEXT,
  approved   BOOLEAN NOT NULL DEFAULT FALSE,   -- commentaire approuvé

  -- horodatages
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE commentary_verses (
  commentary_id BIGINT  NOT NULL REFERENCES commentaries(id) ON DELETE CASCADE,
  verse_id      INTEGER NOT NULL REFERENCES verses(id)      ON DELETE CASCADE,

  -- horodatages
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (commentary_id, verse_id),
  CONSTRAINT uq_commentary_verse UNIQUE (commentary_id, verse_id)
);

CREATE INDEX idx_commentary_verses_commentary ON commentary_verses (commentary_id);
CREATE INDEX idx_commentary_verses_verse      ON commentary_verses (verse_id);
-- Index pour /stats/weekly
CREATE INDEX IF NOT EXISTS idx_med_created_at   ON commentaries (created_at);
CREATE INDEX IF NOT EXISTS idx_med_approved     ON commentaries (updated_at) WHERE approved = TRUE;

-- Trigger: maintained updated_at
CREATE OR REPLACE FUNCTION trg_touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER comment_touch_updated_at
BEFORE UPDATE ON commentary_verses
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

-- Trigger: si le commentaire change → on marque la date ET on désapprouve automatiquement
CREATE OR REPLACE FUNCTION trg_comment_changed() RETURNS trigger AS $$
BEGIN
  IF NEW.text IS DISTINCT FROM OLD.text THEN
    NEW.updated_at := now();
    NEW.approved := FALSE;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER comment_changed
BEFORE UPDATE ON commentary_verses
FOR EACH ROW EXECUTE FUNCTION trg_comment_changed();