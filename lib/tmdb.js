const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_READ_TOKEN}`,
    accept: "application/json",
  };
}

export async function searchMovies(query) {
  const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=es-ES&include_adult=false`;
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

export async function getMovieImages(tmdbId) {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}/images`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`TMDB images falló: ${res.status}`);
  const data = await res.json();

  return data.posters.map((poster) => ({
    url: `${TMDB_IMG_BASE_URL}${poster.file_path}`,
    language: poster.iso_639_1,
  }));
}

export async function getMovieDetails(tmdbId) {
  const [detailsRes, keywordsRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?language=es-ES`, {
      headers: authHeaders(),
    }),
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/keywords`, {
      headers: authHeaders(),
    }),
  ]);

  if (!detailsRes.ok)
    throw new Error(`TMDB details falló: ${detailsRes.status}`);
  const details = await detailsRes.json();
  const keywordsData = keywordsRes.ok
    ? await keywordsRes.json()
    : { keywords: [] };

  return {
    tmdb_id: details.id,
    title: details.title,
    release_year: details.release_date
      ? details.release_date.slice(0, 4)
      : null,
    poster_url: details.poster_path
      ? `${TMDB_IMG_BASE_URL}${details.poster_path}`
      : null,
    genre_ids: details.genres.map((g) => g.id),
    genre_names: details.genres.map((g) => g.name),
    keywords: keywordsData.keywords.map((k) => k.name),
  };
}

const SORT_OPTIONS = [
  "popularity.desc",
  "vote_average.desc",
  "primary_release_date.desc",
];

export async function discoverMovies(genreIds = []) {
  const sortBy = SORT_OPTIONS[Math.floor(Math.random() * SORT_OPTIONS.length)];
  const page = Math.floor(Math.random() * 10) + 1;
  const genresParam = genreIds.join(",");

  const voteFilter =
    sortBy === "vote_average.desc" ? "&vote_count.gte=150" : "";

  const url = `${TMDB_BASE_URL}/discover/movie?with_genres=${genresParam}&language=es-ES&sort_by=${sortBy}${voteFilter}&page=${page}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`TMDB discover falló: ${res.status}`);
  const data = await res.json();

  return {
    page: data.page,
    total_pages: data.total_pages,
    sort_used: sortBy,
    results: data.results.map((movie) => ({
      tmdb_id: movie.id,
      title: movie.title,
      release_year: movie.release_date ? movie.release_date.slice(0, 4) : null,
      poster_url: movie.poster_path
        ? `${TMDB_IMG_BASE_URL}${movie.poster_path}`
        : null,
    })),
  };
}
