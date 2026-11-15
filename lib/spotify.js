// Funciones de Spotify que se usan en varios lugares (servidor y navegador).

// Link o URI de Spotify -> "spotify:album:ID" o "spotify:playlist:ID" (el formato que
// guarda la base y que pide la iFrame API). Acepta:
//   https://open.spotify.com/album/ID?si=...      (también /intl-es/... y /embed/...)
//   https://open.spotify.com/playlist/ID
//   spotify:album:ID
// Devuelve null si no es un álbum o playlist de Spotify.
export function toSpotifyUri(link) {
  if (!link || typeof link !== "string") return null;
  const trimmed = link.trim();

  const direct = trimmed.match(/^spotify:(album|playlist):([A-Za-z0-9]+)$/);
  if (direct) return `spotify:${direct[1]}:${direct[2]}`;

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.hostname !== "open.spotify.com") return null;
  const [type, id] = url.pathname
    .split("/")
    .filter((p) => p && p !== "embed" && !p.startsWith("intl-"));
  if (!["album", "playlist"].includes(type) || !/^[A-Za-z0-9]+$/.test(id ?? "")) return null;
  return `spotify:${type}:${id}`;
}

// ---- Spotify iFrame API (solo navegador) ----
// Script oficial de Spotify que crea el reproductor y entrega un "control"
// con pause(), loadUri(), etc. Se carga una sola vez para todo el sitio
// (lo usan la banda sonora fija y el álbum de la ficha técnica).
let spotifyApiPromise = null;
export function loadSpotifyApi() {
  if (!spotifyApiPromise) {
    spotifyApiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = resolve; // Spotify llama a esta función al terminar de cargar
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);
    });
  }
  return spotifyApiPromise;
}
