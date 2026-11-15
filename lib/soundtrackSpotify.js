import { sql } from "@/lib/db";
import { toSpotifyUri } from "@/lib/spotify";
import { searchSoundtrackAlbum, spotifySearchEnabled } from "@/lib/spotifyApi";

// Álbum de Spotify con la banda sonora de una película/serie (tabla soundtrack_spotify).
// Orden: 1) lo guardado en la tabla, 2) el link que trae MusicBrainz,
// 3) búsqueda en la API de Spotify. Lo que se encuentra se guarda.

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
// titles = [título original, título en español] para buscar en Spotify; year = año de estreno.
// mbFailed = true si MusicBrainz no respondió: entonces no se guarda "no-encontrado".
export async function findSoundtrackUri(tmdbId, mediaType, musicbrainz, { mbFailed = false, titles = [], year = null } = {}) {
  const [row] = await sql`
    SELECT spotify_uri, source, checked_at FROM soundtrack_spotify
    WHERE tmdb_id = ${tmdbId} AND media_type = ${mediaType}
  `;
  if (!needsSearch(row)) return row.spotify_uri;

  // 2) El link de Spotify que trae MusicBrainz
  let uri = toSpotifyUri(musicbrainz?.spotify_link);
  let source = uri ? "musicbrainz" : "no-encontrado";
  let failed = mbFailed;

  // 3) Búsqueda en Spotify: primero con el título original y, si no calza, con el título en español
  if (!uri && spotifySearchEnabled()) {
    try {
      for (const title of [...new Set(titles.filter(Boolean))]) {
        uri = await searchSoundtrackAlbum(title, year);
        if (uri) break;
      }
      if (uri) source = "spotify";
    } catch {
      failed = true;
    }
  }

  // No guardamos "no tiene" si algo falló (MusicBrainz o Spotify) ni si faltan las claves
  // de Spotify: así se vuelve a intentar en la próxima visita y no recién en 30 días.
  if (!uri && (failed || !spotifySearchEnabled())) return null;
  await saveSoundtrackUri(tmdbId, mediaType, uri, source);
  return uri;
}
