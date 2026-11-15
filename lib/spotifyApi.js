import { normalize } from "@/lib/musicbrainz";

// Búsqueda de la banda sonora en la Web API de Spotify (solo en el servidor: usa la clave secreta).
// Necesita SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en .env.local (y en Vercel).
// Ojo (2026): las apps en "modo desarrollo" solo funcionan si el dueño tiene Spotify Premium,
// y la búsqueda devuelve máximo 10 resultados por consulta.

const hasKeys = () => Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);

// ¿Están las claves? Si no, la búsqueda en Spotify simplemente no se hace.
export const spotifySearchEnabled = hasKeys;

// Token de acceso "de servidor" (Client Credentials): dura 1 hora.
// Lo guardamos en memoria y pedimos otro 1 minuto antes de que venza.
let cachedToken = null; // { value, expiresAt }
async function getToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify token falló: ${res.status}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.value;
}

// Palabras que indican que el álbum es una banda sonora (para elegir entre varios que calcen).
const SOUNDTRACK_WORDS = ["soundtrack", "original motion picture", "score", "banda sonora", "music from"];

// Busca "<título> soundtrack" y devuelve "spotify:album:ID" o null si no hay uno que calce.
// Mismas reglas estrictas que MusicBrainz, para no mostrar un álbum equivocado:
// el nombre del álbum debe empezar con el título y el año estar a ±1 del estreno.
// Lanza un error si Spotify falla (así no se guarda "no tiene" por una falla momentánea).
export async function searchSoundtrackAlbum(title, year) {
  if (!hasKeys() || !title) return null;
  const token = await getToken();
  const q = encodeURIComponent(`${title} soundtrack`);
  const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=album&limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 86400 }, // misma búsqueda = misma respuesta por 1 día
  });
  if (!res.ok) throw new Error(`Spotify búsqueda falló: ${res.status}`);
  const data = await res.json();

  const target = normalize(title);
  const movieYear = Number(year);
  const matches = (data.albums?.items ?? []).filter((a) => {
    const name = normalize(a.name);
    if (name !== target && !name.startsWith(`${target} `)) return false;
    const albumYear = Number(a.release_date?.slice(0, 4));
    return !movieYear || !albumYear || Math.abs(albumYear - movieYear) <= 1;
  });
  // Preferimos el que dice "soundtrack", "score", etc.; si no, el primero que calce.
  const best =
    matches.find((a) => SOUNDTRACK_WORDS.some((w) => a.name.toLowerCase().includes(w))) ?? matches[0];
  return best ? `spotify:album:${best.id}` : null;
}
