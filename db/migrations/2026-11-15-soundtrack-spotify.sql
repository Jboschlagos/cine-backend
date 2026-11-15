-- Álbum (o playlist) de Spotify con la banda sonora de cada película/serie de TMDB.
-- Lo usa la ficha técnica para escuchar la banda sonora dentro del sitio.
-- Es un "caché" que se llena solo (MusicBrainz o búsqueda en Spotify) y que puedes
-- corregir a mano desde la ficha técnica con tu sesión de admin.
-- Se puede correr más de una vez sin problema (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS soundtrack_spotify (
  tmdb_id     INTEGER     NOT NULL,
  media_type  VARCHAR(5)  NOT NULL DEFAULT 'movie',  -- 'movie' o 'tv'
  spotify_uri TEXT,                                  -- 'spotify:album:ID' o 'spotify:playlist:ID'; NULL = no tiene
  source      VARCHAR(20) NOT NULL,                  -- 'musicbrainz', 'spotify', 'manual' o 'no-encontrado'
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),    -- "no-encontrado" se vuelve a buscar a los 30 días
  PRIMARY KEY (tmdb_id, media_type)
);
