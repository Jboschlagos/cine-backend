const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Películas y series: TMDB usa casi la misma API, cambiando "movie" por "tv"
// y algunos nombres (title/name, release_date/first_air_date).
export const MEDIA_TYPES = ["movie", "tv"];
// Cuántos actores se guardan por reseña (se muestran menos: ver la página de la reseña).
export const MAX_ACTORS = 5;
const kind = (type) => (type === "tv" ? "tv" : "movie");
const titleOf = (d) => d.title ?? d.name;
const originalTitleOf = (d) => d.original_title ?? d.original_name;
const yearOf = (d) => {
  const date = d.release_date ?? d.first_air_date;
  return date ? date.slice(0, 4) : null;
};

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_READ_TOKEN}`,
    accept: "application/json",
  };
}

// type = "movie" (por defecto) o "tv" (series)
export async function searchMovies(query, type = "movie") {
  const url = `${TMDB_BASE_URL}/search/${kind(type)}?query=${encodeURIComponent(query)}&language=es-ES&include_adult=false`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`TMDB search falló: ${res.status}`);
  const data = await res.json();

  return data.results.map((movie) => ({
    tmdb_id: movie.id,
    title: titleOf(movie),
    original_title: originalTitleOf(movie),
    release_year: yearOf(movie),
    poster_url: movie.poster_path
      ? `${TMDB_IMG_BASE_URL}${movie.poster_path}`
      : null,
    genre_ids: movie.genre_ids,
  }));
}

// Una tarjeta de Descubrir (película o serie). media_type le dice a la
// ficha técnica si tiene que pedir /movie o /tv.
function toDiscoverItem(d, type) {
  return {
    tmdb_id: d.id,
    media_type: kind(type),
    title: titleOf(d),
    release_year: yearOf(d),
    poster_url: d.poster_path ? `${TMDB_IMG_BASE_URL}${d.poster_path}` : null,
    genre_ids: d.genre_ids ?? [],
    vote_average: d.vote_average || null,
  };
}

// Búsqueda por título para Descubrir: igual a searchMovies, pero con página
// y nota, en el mismo formato que discoverMovies (para usar la misma grilla).
// type = "movie" (por defecto) o "tv"
export async function searchMoviesPage(query, page = 1, type = "movie") {
  const url = `${TMDB_BASE_URL}/search/${kind(type)}?query=${encodeURIComponent(query)}&language=es-ES&include_adult=false&page=${page}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`TMDB search falló: ${res.status}`);
  const data = await res.json();

  return {
    page: data.page,
    total_pages: data.total_pages,
    sort_used: null,
    results: data.results.map((d) => toDiscoverItem(d, type)),
  };
}

export async function getMovieImages(tmdbId, type = "movie") {
  const url = `${TMDB_BASE_URL}/${kind(type)}/${tmdbId}/images`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`TMDB images falló: ${res.status}`);
  const data = await res.json();

  return data.posters.map((poster) => ({
    url: `${TMDB_IMG_BASE_URL}${poster.file_path}`,
    language: poster.iso_639_1,
  }));
}

// Nombres del equipo técnico con ciertos cargos, ej. ["Director"] -> "Christopher Nolan"
function crewNames(details, jobs) {
  const names = (details.credits?.crew ?? [])
    .filter((c) => jobs.includes(c.job))
    .map((c) => c.name);
  return names.length ? [...new Set(names)].join(", ") : null;
}

export async function getMovieDetails(tmdbId, type = "movie") {
  const k = kind(type);
  const [detailsRes, keywordsRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/${k}/${tmdbId}?language=es-ES&append_to_response=credits`, {
      headers: authHeaders(),
    }),
    fetch(`${TMDB_BASE_URL}/${k}/${tmdbId}/keywords`, {
      headers: authHeaders(),
    }),
  ]);

  if (!detailsRes.ok)
    throw new Error(`TMDB details falló: ${detailsRes.status}`);
  const details = await detailsRes.json();
  const keywordsData = keywordsRes.ok
    ? await keywordsRes.json()
    : { keywords: [] };
  // En series las keywords vienen en "results" en vez de "keywords"
  const keywordList = keywordsData.keywords ?? keywordsData.results ?? [];
  const creators = (details.created_by ?? []).map((c) => c.name);

  return {
    tmdb_id: details.id,
    media_type: k,
    title: titleOf(details),
    release_year: yearOf(details),
    poster_url: details.poster_path
      ? `${TMDB_IMG_BASE_URL}${details.poster_path}`
      : null,
    genre_ids: details.genres.map((g) => g.id),
    genre_names: details.genres.map((g) => g.name),
    // Para los filtros de origen y duración del feed
    countries: details.origin_country?.length
      ? details.origin_country
      : (details.production_countries ?? []).map((c) => c.iso_3166_1),
    // En series: duración de un episodio
    runtime: details.runtime || details.episode_run_time?.[0] || details.last_episode_to_air?.runtime || null,
    keywords: keywordList.map((kw) => kw.name),
    // Para la mini ficha del feed: director (en series, creadores) y compositor de la música
    director: k === "tv" ? creators.join(", ") || null : crewNames(details, ["Director"]),
    composer:
      crewNames(details, ["Original Music Composer"]) ??
      crewNames(details, ["Music"]),
    // Actores principales (los 5 primeros del reparto, en el orden de TMDB)
    actors: (details.credits?.cast ?? []).slice(0, MAX_ACTORS).map((c) => c.name),
  };
}

// Órdenes posibles en Descubrir. En series la fecha es "first_air_date"
// (TMDB no acepta "primary_release_date" en /discover/tv).
export const SORT_OPTIONS = {
  movie: ["popularity.desc", "vote_average.desc", "primary_release_date.desc"],
  tv: ["popularity.desc", "vote_average.desc", "first_air_date.desc"],
};

// Parámetro de fecha de estreno para la época.
const DATE_PARAM = { movie: "primary_release_date", tv: "first_air_date" };

// Las series tienen menos votos: con "mejor calificadas" pedimos un mínimo más bajo.
const MIN_VOTES = { movie: "150", tv: "100" };

// En series dejamos fuera noticieros, realities y talk shows.
const TV_EXCLUDED_GENRES = [10763, 10764, 10767];

// Busca el ID de TMDB de cada palabra clave (ej. "coming of age" -> un número).
// Se guarda en caché 1 día: los IDs no cambian, y así no gastamos llamadas
// (la selección de películas sigue siendo aleatoria en cada visita).
async function getKeywordIds(names) {
  const ids = await Promise.all(
    names.map(async (name) => {
      const res = await fetch(
        `${TMDB_BASE_URL}/search/keyword?query=${encodeURIComponent(name)}`,
        { headers: authHeaders(), next: { revalidate: 86400 } },
      );
      if (!res.ok) return null;
      const data = await res.json();
      const match = data.results.find(
        (k) => k.name.toLowerCase() === name.toLowerCase(),
      );
      return match?.id ?? null;
    }),
  );
  return ids.filter(Boolean);
}

// Busca el ID de cada plataforma de streaming en Chile (ej. "netflix" -> 8).
// Se guarda en caché 1 día. aliases = { netflix: ["netflix"], ... }
// type = "movie" o "tv" (TMDB tiene una lista de plataformas para cada uno).
async function getProviderIds(keys, aliases, type = "movie") {
  const res = await fetch(
    `${TMDB_BASE_URL}/watch/providers/${kind(type)}?watch_region=CL&language=es-ES`,
    { headers: authHeaders(), next: { revalidate: 86400 } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  const wanted = keys.flatMap((k) => aliases[k] ?? []);
  return (data.results ?? [])
    .filter((p) => wanted.includes(p.provider_name.toLowerCase()))
    .map((p) => p.provider_id);
}

// filters (todos opcionales, salen de lib/filters.js):
//   genreIds, keywordNames  -> mood
//   yearFrom, yearTo        -> época
//   countries               -> origen (códigos de país, ej. ["CL"])
//   minRuntime, maxRuntime  -> duración en minutos
//   providerKeys, providerAliases -> dónde verla (streaming en Chile)
// Se usa "|" (O) dentro de cada filtro: ej. Terror O Thriller.
// options.sortBy y options.page sirven para "Ver más": pedir la página siguiente
// con el MISMO orden. Si no vienen, se eligen al azar.
// options.type = "movie" (por defecto) o "tv" para descubrir series.
export async function discoverMovies(filters = {}, options = {}) {
  const type = kind(options.type);
  const sortOptions = SORT_OPTIONS[type];
  const {
    genreIds = [],
    keywordNames = [],
    yearFrom,
    yearTo,
    countries = [],
    minRuntime,
    maxRuntime,
    providerKeys = [],
    providerAliases = {},
  } = filters;
  const sortBy = sortOptions.includes(options.sortBy)
    ? options.sortBy
    : sortOptions[Math.floor(Math.random() * sortOptions.length)];

  const keywordIds = keywordNames.length ? await getKeywordIds(keywordNames) : [];
  // Si el mood usa keywords y no encontramos ninguna, mejor no mostrar nada
  // que mostrar películas cualquiera.
  if (keywordNames.length && keywordIds.length === 0) {
    return { page: 1, total_pages: 0, sort_used: sortBy, results: [] };
  }

  const params = new URLSearchParams({
    language: "es-ES",
    sort_by: sortBy,
    include_adult: "false",
  });
  const providerIds = providerKeys.length
    ? await getProviderIds(providerKeys, providerAliases, type)
    : [];
  if (providerKeys.length && providerIds.length === 0) {
    return { page: 1, total_pages: 0, sort_used: sortBy, results: [] };
  }

  if (genreIds.length) params.set("with_genres", genreIds.join("|"));
  if (type === "tv") params.set("without_genres", TV_EXCLUDED_GENRES.join("|"));
  if (yearFrom) params.set(`${DATE_PARAM[type]}.gte`, `${yearFrom}-01-01`);
  if (yearTo) params.set(`${DATE_PARAM[type]}.lte`, `${yearTo}-12-31`);
  if (countries.length) params.set("with_origin_country", countries.join("|"));
  if (minRuntime) params.set("with_runtime.gte", String(minRuntime));
  if (maxRuntime) params.set("with_runtime.lte", String(maxRuntime));
  if (providerIds.length) {
    params.set("with_watch_providers", providerIds.join("|"));
    params.set("watch_region", "CL");
    params.set("with_watch_monetization_types", "flatrate");
  }
  if (keywordIds.length) params.set("with_keywords", keywordIds.join("|"));
  if (sortBy === "vote_average.desc") params.set("vote_count.gte", MIN_VOTES[type]);

  async function fetchPage(page) {
    params.set("page", String(page));
    const res = await fetch(`${TMDB_BASE_URL}/discover/${type}?${params}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`TMDB discover falló: ${res.status}`);
    return res.json();
  }

  // Página al azar entre 1 y 10. Si esa página no existe (hay pocos
  // resultados), pedimos otra al azar dentro de las que sí existen.
  let data = await fetchPage(options.page ?? Math.floor(Math.random() * 10) + 1);
  if (!options.page && data.results.length === 0 && data.total_pages > 0) {
    const maxPage = Math.min(data.total_pages, 500); // TMDB no da más de 500
    data = await fetchPage(Math.floor(Math.random() * maxPage) + 1);
  }

  return {
    page: data.page,
    total_pages: data.total_pages,
    sort_used: sortBy,
    results: data.results.map((d) => toDiscoverItem(d, type)),
  };
}

// "Descubrir más como esta": recomendaciones de TMDB a partir de una película o serie.
// Pide el título de la de base y las 2 primeras páginas de recomendaciones
// (TMDB casi nunca tiene más), todo en paralelo y en caché por 1 día.
// Devuelve { title, results } o null si ese id no existe en TMDB.
export async function getRecommendations(tmdbId, type = "movie") {
  const k = kind(type);
  const get = async (path) => {
    const res = await fetch(`${TMDB_BASE_URL}/${k}/${tmdbId}${path}`, {
      headers: authHeaders(),
      next: { revalidate: 86400 },
    });
    return res.ok ? res.json() : null;
  };
  const [details, page1, page2] = await Promise.all([
    get("?language=es-ES"),
    get("/recommendations?language=es-ES&page=1"),
    get("/recommendations?language=es-ES&page=2"),
  ]);
  if (!details) return null;

  // Juntamos las dos páginas sin repetir (ni incluir la película de base).
  const seen = new Set([details.id]);
  const results = [...(page1?.results ?? []), ...(page2?.results ?? [])]
    .filter((d) => !seen.has(d.id) && seen.add(d.id))
    .map((d) => toDiscoverItem(d, k));

  return { title: titleOf(details), results };
}

// Tráiler para la página de una reseña, en el idioma ORIGINAL de la película o serie.
// Orden: oficial en idioma original -> no oficial en idioma original -> oficial en inglés.
// Solo tráileres de YouTube. Devuelve { key, name } o null si no hay.
// Son 2 llamadas (primero hay que saber el idioma original); en caché 1 día.
export async function getTrailer(tmdbId, type = "movie") {
  const k = kind(type);
  const get = async (path) => {
    const res = await fetch(`${TMDB_BASE_URL}/${k}/${tmdbId}${path}`, {
      headers: authHeaders(),
      next: { revalidate: 86400 },
    });
    return res.ok ? res.json() : null;
  };
  const details = await get("");
  if (!details) return null;
  const lang = details.original_language || "en";
  // Sin include_video_language TMDB solo devuelve los videos en inglés.
  const data = await get(`/videos?include_video_language=${lang},en`);

  const trailers = (data?.results ?? []).filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const trailer =
    trailers.find((v) => v.iso_639_1 === lang && v.official) ??
    trailers.find((v) => v.iso_639_1 === lang) ??
    trailers.find((v) => v.iso_639_1 === "en" && v.official) ??
    null;
  return trailer ? { key: trailer.key, name: trailer.name } : null;
}

// Cargos de TMDB que cuentan como "compositor" (igual que al guardar una reseña).
const COMPOSER_JOBS = ["Original Music Composer", "Music"];

// Lista de personas de TMDB -> [{ id, name }], sin repetir (una persona puede tener 2 cargos).
function people(list) {
  const seen = new Set();
  return list
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .map((p) => ({ id: p.id, name: p.name }));
}

// Cargos de TMDB que corresponden a cada rol de la vista de persona.
// En series, "director" son quienes la crearon (igual que en tus reseñas).
const ROLE_JOBS = {
  movie: { director: ["Director"], compositor: COMPOSER_JOBS },
  tv: { director: ["Creator"], compositor: COMPOSER_JOBS },
};

// Vista de persona en Descubrir: nombre + sus películas (o series) en ese rol.
// rol = "director" | "compositor" | "actor"; type = "movie" o "tv".
// Orden: de la más nueva a la más antigua (sin fecha, al final). Sin mínimo de popularidad.
// Devuelve { name, results } o null si la persona no existe en TMDB. En caché 1 día.
export async function getPersonCredits(personId, rol, type = "movie") {
  const k = kind(type);
  const get = async (path) => {
    const res = await fetch(`${TMDB_BASE_URL}/person/${personId}${path}`, {
      headers: authHeaders(),
      next: { revalidate: 86400 },
    });
    return res.ok ? res.json() : null;
  };
  const [person, credits] = await Promise.all([
    get("?language=es-ES"),
    get(`/${k}_credits?language=es-ES`),
  ]);
  if (!person) return null;

  const list =
    rol === "actor"
      ? (credits?.cast ?? [])
      : (credits?.crew ?? []).filter((c) => ROLE_JOBS[k][rol]?.includes(c.job));

  // Sin repetir (un actor puede tener 2 personajes) y, en series, sin noticieros,
  // realities ni talk shows (igual que en Descubrir).
  const seen = new Set();
  const results = list
    .filter((d) => !seen.has(d.id) && seen.add(d.id))
    .filter((d) => k !== "tv" || !(d.genre_ids ?? []).some((g) => TV_EXCLUDED_GENRES.includes(g)))
    .map((d) => toDiscoverItem(d, k))
    .sort((a, b) => (Number(b.release_year) || 0) - (Number(a.release_year) || 0));

  return { name: person.name, results };
}

// Ficha técnica completa en UNA sola llamada: "append_to_response" le pide
// a TMDB que junte detalles + reparto + videos + keywords + dónde verla.
export async function getMovieSheet(tmdbId, type = "movie") {
  const k = kind(type);
  const url = `${TMDB_BASE_URL}/${k}/${tmdbId}?language=es-ES&append_to_response=credits,videos,keywords,watch/providers,images&include_video_language=es,en&include_image_language=es,en,null`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`TMDB ficha falló: ${res.status}`);
  const d = await res.json();

  // Tráiler: preferimos uno en español, si no en inglés, si no un teaser.
  const videos = (d.videos?.results ?? []).filter((v) => v.site === "YouTube");
  const pick = (lang, type) =>
    videos.find((v) => v.iso_639_1 === lang && v.type === type);
  const trailer =
    pick("es", "Trailer") ??
    pick("en", "Trailer") ??
    pick("es", "Teaser") ??
    pick("en", "Teaser") ??
    null;

  // Dónde verla en Chile (datos de JustWatch). "flatrate" = streaming por suscripción.
  const cl = d["watch/providers"]?.results?.CL;

  return {
    tmdb_id: d.id,
    media_type: k,
    title: titleOf(d),
    original_title: originalTitleOf(d),
    overview: d.overview,
    release_year: yearOf(d),
    // En series: duración de un episodio y número de temporadas
    runtime: d.runtime || d.episode_run_time?.[0] || d.last_episode_to_air?.runtime || null,
    seasons: d.number_of_seasons ?? null,
    genre_ids: (d.genres ?? []).map((g) => g.id),
    genre_names: (d.genres ?? []).map((g) => g.name),
    keywords: (d.keywords?.keywords ?? d.keywords?.results ?? []).map((kw) => kw.name),
    // Personas como { id, name }: el id de TMDB sirve para el link "más de esta persona".
    // En series no hay un director: mostramos a quienes la crearon
    directors: people(
      k === "tv" ? (d.created_by ?? []) : (d.credits?.crew ?? []).filter((c) => c.job === "Director"),
    ),
    composers: people(
      (d.credits?.crew ?? []).filter((c) => COMPOSER_JOBS.includes(c.job)),
    ),
    cast: people((d.credits?.cast ?? []).slice(0, 5)),
    vote_average: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    trailer_key: trailer?.key ?? null,
    // Afiches para el carrusel: el principal primero, sin repetir, máximo 15.
    posters: [
      ...new Set(
        [d.poster_path, ...(d.images?.posters ?? []).map((p) => p.file_path)].filter(Boolean),
      ),
    ]
      .slice(0, 15)
      .map((path) => `${TMDB_IMG_BASE_URL}${path}`),
    providers: {
      link: cl?.link ?? null,
      streaming: (cl?.flatrate ?? []).map((p) => ({
        name: p.provider_name,
        logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
      })),
    },
  };
}
