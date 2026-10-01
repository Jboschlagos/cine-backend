-- Esquema para la página de reseñas de cine
-- Ejecutar contra la base de datos de Neon (psql, o el editor SQL de Neon)
--
-- NOTA sobre autenticación: las tablas de usuario/sesión (user, session,
-- account, verification) las genera Better Auth automáticamente, no van acá.
-- Antes de correr este archivo, corré desde la raíz del proyecto:
--   npx @better-auth/cli generate
--   npx @better-auth/cli migrate
-- (usa BETTER_AUTH_URL/DATABASE_URL de tu .env.local)

CREATE TABLE IF NOT EXISTS reviews (
  id                  SERIAL PRIMARY KEY,
  tmdb_id             INTEGER NOT NULL,
  title               VARCHAR(255) NOT NULL,
  poster_url          TEXT,
  release_year        INTEGER,
  genres              TEXT[],                 -- nombres de géneros de TMDB, ej. {'Drama','Terror'}
  review_text         TEXT NOT NULL,
  mood                VARCHAR(50) NOT NULL,   -- resultado del mapeo automático, ej. 'para-llorar'
  soundtrack_embed_url TEXT,                  -- URL de embed de Spotify o YouTube
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  review_id   INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  name        VARCHAR(80) NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_mood ON reviews(mood);
CREATE INDEX IF NOT EXISTS idx_comments_review_id ON comments(review_id);

CREATE TABLE IF NOT EXISTS review_images (
  id         SERIAL PRIMARY KEY,
  review_id  INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);
