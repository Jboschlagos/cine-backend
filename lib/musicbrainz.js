// Busca la banda sonora de una película en MusicBrainz (base de datos
// de música abierta y gratuita, no necesita clave).
// Reglas de MusicBrainz: hay que mandar un User-Agent que identifique la app
// y no pasar de 1 consulta por segundo -> por eso guardamos todo en caché 1 semana.
const MB_BASE_URL = "https://musicbrainz.org/ws/2";
const MB_HEADERS = {
  "User-Agent": "PaginaCine/0.1 (https://github.com/Jboschlagos/cine-backend)",
  accept: "application/json",
};
const ONE_WEEK = 60 * 60 * 24 * 7;

// "¡Amélie!" -> "amelie": sin tildes, sin signos, en minúsculas.
function normalize(text = "") {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mbFetch(path) {
  return fetch(`${MB_BASE_URL}${path}`, {
    headers: MB_HEADERS,
    next: { revalidate: ONE_WEEK },
  });
}

// Devuelve { album, artist, url, tracks: [{ title, artist, length }] } o null.
export async function findSoundtrack(title, year) {
  const clean = title.replace(/["\\]/g, "");
  const query = `releasegroup:"${clean}" AND secondarytype:soundtrack`;
  const res = await mbFetch(
    `/release-group?query=${encodeURIComponent(query)}&fmt=json&limit=10`,
  );
  if (!res.ok) return null;
  const data = await res.json();

  // Somos estrictos para no mostrar un álbum equivocado:
  // el nombre del álbum debe empezar con el título de la película
  // y, si hay fechas, el año debe estar a ±1 año del estreno.
  const target = normalize(title);
  const movieYear = Number(year);
  const group = (data["release-groups"] ?? []).find((g) => {
    const name = normalize(g.title);
    if (name !== target && !name.startsWith(`${target} `)) return false;
    const albumYear = Number(g["first-release-date"]?.slice(0, 4));
    return !movieYear || !albumYear || Math.abs(albumYear - movieYear) <= 1;
  });
  if (!group) return null;

  const release =
    group.releases?.find((r) => r.status === "Official") ?? group.releases?.[0];
  if (!release) return null;

  const relRes = await mbFetch(
    `/release/${release.id}?inc=recordings+artist-credits&fmt=json`,
  );
  if (!relRes.ok) return null;
  const rel = await relRes.json();

  const credit = (ac) =>
    (ac ?? []).map((a) => a.name + (a.joinphrase ?? "")).join("");

  return {
    album: group.title,
    artist: credit(group["artist-credit"]),
    url: `https://musicbrainz.org/release/${release.id}`,
    tracks: (rel.media ?? []).flatMap((m) =>
      (m.tracks ?? []).map((t) => ({
        title: t.title,
        artist: credit(t["artist-credit"]),
        length: t.length ?? null, // en milisegundos
      })),
    ),
  };
}
