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

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID o youtube.com/embed/ID
  if (url.hostname === "youtu.be" || url.hostname.endsWith("youtube.com")) {
    let id = null;
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
    else id = url.searchParams.get("v");
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}`;
  }

  return null;
}
