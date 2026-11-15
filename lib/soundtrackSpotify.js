import { sql } from "@/lib/db";
import { toSpotifyUri } from "@/lib/spotify";

// Álbum de Spotify con la banda sonora de una película/serie (tabla soundtrack_spotify).
// Orden: 1) lo guardado en la tabla, 2) el link que trae MusicBrainz,
// 3) (Parte B) búsqueda en la API de Spotify. Lo que se encuentra se guarda.

// "No encontrado" se vuelve a buscar después de estos días (por si aparece después).
const RETRY_DAYS = 30;

// ¿Hay que volver a buscar? Solo si no tiene álbum, no lo marcaste tú a mano
// ("No tiene") y pasaron más de RETRY_DAYS desde la última búsqueda.
function needsSearch(row) {
  if (!row) return true;
  if (row.spotify_uri || row.source === "manual") return false;
  return Date.now() - new Date(row.checked_at).getTime() > RETRY_DAYS * 24 * 60 * 60 * 1000;
}

// Guarda (o reemplaza) el álbum de una película. uri = null -> "no tiene".
export async function saveSoundtrackUri(tmdbId, mediaType, uri, source) {
  await sql`
    INSERT INTO soundtrack_spotify (tmdb_id, media_type, spotify_uri, source, checked_at)
    VALUES (${tmdbId}, ${mediaType}, ${uri}, ${source}, now())
    ON CONFLICT (tmdb_id, media_type)
    DO UPDATE SET spotify_uri = EXCLUDED.spotify_uri, source = EXCLUDED.source, checked_at = now()
  `;
}

// Devuelve el URI de Spotify ("spotify:album:ID") o null.
// musicbrainz = resultado de findSoundtrack() (puede ser null).
// mbFailed = true si MusicBrainz no respondió: entonces no se guarda "no-encontrado".
export async function findSoundtrackUri(tmdbId, mediaType, musicbrainz, { mbFailed = false } = {}) {
  const [row] = await sql`
    SELECT spotify_uri, source, checked_at FROM soundtrack_spotify
    WHERE tmdb_id = ${tmdbId} AND media_type = ${mediaType}
  `;
  if (!needsSearch(row)) return row.spotify_uri;

  const uri = toSpotifyUri(musicbrainz?.spotify_link);
  const source = uri ? "musicbrainz" : "no-encontrado";
  // (Parte B: si no hay, buscar en la API de Spotify aquí)

  // Una falla momentánea de MusicBrainz no cuenta como "no tiene": no guardamos nada.
  if (!uri && mbFailed) return null;
  await saveSoundtrackUri(tmdbId, mediaType, uri, source);
  return uri;
}
