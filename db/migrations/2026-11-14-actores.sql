-- Actores principales de cada reseña (hasta 5, en el orden de TMDB).
-- Sirven para el filtro ?actor= de la portada y para "Si te gustó esta…".
-- Se puede correr más de una vez sin problema (IF NOT EXISTS).
-- Después de correrla, completa las reseñas existentes con:
--   node --env-file=.env.local db/backfill-actors.mjs

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS actors TEXT[];
