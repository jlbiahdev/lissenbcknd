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

-- Table des themes
CREATE TABLE themes (
  name TEXT PRIMARY KEY
);

-- Table des versets méditatifs
CREATE TABLE meditative_verses (
  id                 BIGSERIAL PRIMARY KEY,
  verse_id           INTEGER REFERENCES verses(id) ON DELETE CASCADE,
  themes             TEXT[],
  commentary         TEXT,
  approved   BOOLEAN NOT NULL DEFAULT FALSE,   -- commentaire approuvé

  -- horodatages
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),  -- insertion = « sélectionné comme méditatif »
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  commentary_updated_at TIMESTAMPTZ
);

-- Un seul enregistrement par verset (si c’est ta règle métier)
ALTER TABLE meditative_verses
  ADD CONSTRAINT uq_meditative_verse UNIQUE (verse_id);

-- Index pour /stats/weekly
CREATE INDEX IF NOT EXISTS idx_medv_created_at   ON meditative_verses (created_at);
CREATE INDEX IF NOT EXISTS idx_medv_comm_upd_at  ON meditative_verses (commentary_updated_at) WHERE commentary_updated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medv_approved     ON meditative_verses (updated_at) WHERE approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_medv_verse_id     ON meditative_verses (verse_id);

-- Trigger: maintained updated_at
CREATE OR REPLACE FUNCTION trg_touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER medv_touch_updated_at
BEFORE UPDATE ON meditative_verses
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

-- Trigger: si le commentaire change → on marque la date ET on désapprouve automatiquement
CREATE OR REPLACE FUNCTION trg_comment_changed() RETURNS trigger AS $$
BEGIN
  IF NEW.commentary IS DISTINCT FROM OLD.commentary THEN
    NEW.commentary_updated_at := now();
    NEW.approved := FALSE;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER medv_comment_changed
BEFORE UPDATE ON meditative_verses
FOR EACH ROW EXECUTE FUNCTION trg_comment_changed();


