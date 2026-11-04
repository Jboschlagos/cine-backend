-- Migración: soporte de series + importación de Instagram.
-- Correr UNA vez en el editor SQL de Neon (es seguro correrlo de nuevo).

-- 1) Series: cada reseña es de una película ('movie') o de una serie ('tv').
--    Las reseñas que ya tienes quedan como 'movie'.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS media_type VARCHAR(5) NOT NULL DEFAULT 'movie';
DO $$ BEGIN
  ALTER TABLE reviews ADD CONSTRAINT reviews_media_type_check CHECK (media_type IN ('movie', 'tv'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_reviews_media_type ON reviews(media_type);

-- 2) Posts de Instagram por revisar (los llena el botón "Leer exportación" del admin).
--    images = rutas dentro de la carpeta de la exportación, ej. 'media/posts/123.webp'
--    status: 'pendiente' | 'publicado' | 'descartado'
CREATE TABLE IF NOT EXISTS ig_posts (
  id           SERIAL PRIMARY KEY,
  ig_key       TEXT NOT NULL UNIQUE,      -- ruta de la primera foto: identifica el post si vuelves a leer la exportación
  posted_at    TIMESTAMPTZ NOT NULL,      -- fecha del post en IG (será la fecha de la reseña)
  caption      TEXT NOT NULL DEFAULT '',
  title_guess  TEXT,                      -- título detectado en la 1.ª línea, ej. 'Garden State'
  alt_title    TEXT,                      -- título en español si venía entre paréntesis
  year_guess   INTEGER,
  series_guess BOOLEAN NOT NULL DEFAULT false,
  images       TEXT[] NOT NULL DEFAULT '{}',
  status       VARCHAR(12) NOT NULL DEFAULT 'pendiente'
               CHECK (status IN ('pendiente', 'publicado', 'descartado')),
  review_id    INTEGER REFERENCES reviews(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_ig_posts_status ON ig_posts(status);
