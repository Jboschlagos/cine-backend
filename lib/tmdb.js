// Todas las llamadas a TMDB pasan por acá y corren en el servidor
// (dentro de una API route), nunca desde el navegador del visitante.
// La API key nunca se expone al cliente.

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_READ_TOKEN}`,
    accept: "application/json",
  };
}

// Busca películas por título, para el buscador del panel de admin.
export async function searchMovies(query) {
  const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(
    query
  )}&language=es-ES&include_adult=false`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`TMDB search falló: ${res.status}`);
  const data = await res.json();

  return data.results.map((movie) => ({
    tmdb_id: movie.id,
    title: movie.title,
    release_year: movie.release_date ? movie.release_date.slice(0, 4) : null,
    poster_url: movie.poster_path
      ? `${TMDB_IMG_BASE_URL}${movie.poster_path}`
      : null,
    genre_ids: movie.genre_ids,
  }));
}

// Trae detalle + keywords de una película puntual, para inferir el mood
// con más precisión al momento de guardar la reseña.
export async function getMovieDetails(tmdbId) {
  const [detailsRes, keywordsRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?language=es-ES`, {
      headers: authHeaders(),
    }),
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/keywords`, {
      headers: authHeaders(),
    }),
  ]);

  if (!detailsRes.ok) throw new Error(`TMDB details falló: ${detailsRes.status}`);
  const details = await detailsRes.json();
  const keywordsData = keywordsRes.ok ? await keywordsRes.json() : { keywords: [] };

  return {
    tmdb_id: details.id,
    title: details.title,
    release_year: details.release_date ? details.release_date.slice(0, 4) : null,
    poster_url: details.poster_path
      ? `${TMDB_IMG_BASE_URL}${details.poster_path}`
      : null,
    genre_ids: details.genres.map((g) => g.id),
    genre_names: details.genres.map((g) => g.name),
    keywords: keywordsData.keywords.map((k) => k.name),
  };
}
