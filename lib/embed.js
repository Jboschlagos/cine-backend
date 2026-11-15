// Convierte un link normal de Spotify o YouTube en su URL de "embed"
// (la que se puede poner dentro de un <iframe>).
// Devuelve null si el link no es de esos sitios: así nunca metemos
// una página cualquiera dentro de nuestro sitio.
export function toEmbedUrl(link) {
  if (!link) return null;

  let url;
  try {
    url = new URL(link);
  } catch {
    return null;
  }

  // Spotify: /track/ID, /album/ID, /playlist/ID (también /intl-es/track/ID o /embed/track/ID)
  if (url.hostname === "open.spotify.com") {
    const parts = url.pathname
      .split("/")
      .filter((p) => p && p !== "embed" && !p.startsWith("intl-"));
    const [type, id] = parts;
    if (!["track", "album", "playlist"].includes(type) || !id) return null;
    return `https://open.spotify.com/embed/${type}/${id}`;
  }

  // YouTube (videos y playlists). Siempre con youtube-nocookie (sin cookies de seguimiento).
  // La URL de embed se arma desde cero con solo el ID: parámetros extra como "si=" se ignoran.
  if (isYouTubeHost(url.hostname)) {
    // Playlist: /playlist?list=ID. Si el link trae video Y lista (watch?v=X&list=Y),
    // se usa solo la lista, desde el comienzo.
    const list = url.searchParams.get("list");
    if (list) return YT_ID.test(list) ? `${YT_EMBED}/videoseries?list=${list}` : null;

    // Video: youtu.be/ID, /embed/ID o watch?v=ID (también m. y music.youtube.com)
    let id = null;
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
    else id = url.searchParams.get("v");
    if (!id || id === "videoseries" || !YT_ID.test(id)) return null;
    return `${YT_EMBED}/${id}`;
  }

  return null;
}

const YT_EMBED = "https://www.youtube-nocookie.com/embed";
// Los IDs de YouTube solo tienen letras, números, "-" y "_": cualquier otra cosa se rechaza.
const YT_ID = /^[\w-]+$/;

// youtu.be, youtube.com, www./m./music.youtube.com y youtube-nocookie.com
// (este último para que las URLs de embed ya guardadas sigan siendo válidas).
function isYouTubeHost(hostname) {
  const host = hostname.replace(/^www\./, "");
  return (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtube-nocookie.com"
  );
}
