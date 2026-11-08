// Todos los filtros del sitio en un solo lugar.
// Cada filtro es una parte de la frase "Hoy quiero algo ...".
// Para agregar una opción: súmala en "options" y, si corresponde, en su tabla de datos.
import { getMoodFilters } from "@/lib/mood";

export const FILTERS = {
  mood: {
    all: "de todo",
    groups: [
      { title: "Sentir", keys: ["para-llorar", "romantica", "nostalgica", "inspiradora"] },
      { title: "Pulso", keys: ["adrenalina", "tension", "misteriosa"] },
      { title: "Disfrutar", keys: ["para-reir", "para-pensar", "musical"] },
    ],
    options: {
      "para-llorar": "para llorar",
      romantica: "romántico",
      nostalgica: "nostálgico",
      inspiradora: "inspirador",
      adrenalina: "con adrenalina",
      tension: "con tensión",
      misteriosa: "misterioso",
      "para-reir": "para reírme",
      "para-pensar": "para pensar",
      musical: "musical",
    },
  },
  origin: {
    all: "de cualquier parte",
    options: {
      chile: "chileno",
      latam: "latinoamericano",
      eeuu: "estadounidense",
      europa: "europeo",
      asia: "asiático",
    },
  },
  era: {
    all: "de cualquier época",
    options: {
      clasicos: "clásico (antes del 70)",
      "70s": "de los 70",
      "80s": "de los 80",
      "90s": "de los 90",
      "2000s": "de los 2000",
      "2010s": "de los 2010",
      recientes: "reciente (2020 en adelante)",
    },
  },
  length: {
    all: "de cualquier duración",
    options: {
      corta: "cortito (menos de 100 min)",
      normal: "de duración normal",
      larga: "de largo aliento (más de 150 min)",
    },
  },
  where: {
    all: "en cualquier lado",
    options: {
      netflix: "en Netflix",
      prime: "en Prime Video",
      disney: "en Disney+",
      max: "en Max",
      mubi: "en MUBI",
    },
  },
};

// ---- Datos detrás de cada opción ----
const ERA_YEARS = {
  clasicos: [null, 1969],
  "70s": [1970, 1979],
  "80s": [1980, 1989],
  "90s": [1990, 1999],
  "2000s": [2000, 2009],
  "2010s": [2010, 2019],
  recientes: [2020, null],
};

const ORIGIN_COUNTRIES = {
  chile: ["CL"],
  latam: ["AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "GT", "HN", "MX", "NI", "PA", "PE", "PR", "PY", "SV", "UY", "VE"],
  eeuu: ["US"],
  europa: ["AT", "BA", "BE", "CH", "CZ", "DE", "DK", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE"],
  asia: ["CN", "HK", "IN", "IR", "JP", "KR", "TH", "TW"],
};

const LENGTH_MINUTES = {
  corta: [null, 99],
  normal: [100, 150],
  larga: [151, null],
};

// Nombres con que TMDB llama a cada plataforma (en minúsculas).
const PROVIDER_ALIASES = {
  netflix: ["netflix"],
  prime: ["amazon prime video"],
  disney: ["disney plus", "disney+"],
  max: ["max", "hbo max"],
  mubi: ["mubi"],
};

// Lee la URL (?mood=...&era=...) y deja solo valores válidos.
export function readFilters(searchParams, allowed = Object.keys(FILTERS)) {
  const active = {};
  for (const name of allowed) {
    const value = searchParams?.[name];
    if (typeof value === "string" && FILTERS[name].options[value]) active[name] = value;
  }
  return active;
}

// { mood: "tension", era: "80s" } -> "mood=tension&era=80s"
export function toQuery(active) {
  return new URLSearchParams(active).toString();
}

// ?tipo=serie -> "tv"; si no viene (o no es válido) -> "movie".
// Es el mismo parámetro que usa /api/feed en la página de Series.
export function readMediaType(searchParams) {
  return searchParams?.tipo === "serie" ? "tv" : "movie";
}

// Para guardar el tipo en la URL junto a los otros parámetros (películas = sin nada).
export function mediaTypeParams(type) {
  return type === "tv" ? { tipo: "serie" } : {};
}

// Filtros de Descubrir según el tipo: en series no va "duración"
// (TMDB la aplica a un episodio, no sirve para filtrar).
export const DISCOVER_SEGMENTS = {
  movie: ["mood", "origin", "era", "length", "where"],
  tv: ["mood", "origin", "era", "where"],
};

// Filtros para TMDB (Descubrir). type = "movie" o "tv"
export function toDiscoverFilters(active, type = "movie") {
  const isTv = type === "tv";
  const [yearFrom, yearTo] = ERA_YEARS[active.era] ?? [];
  const [minRuntime, maxRuntime] = isTv ? [] : (LENGTH_MINUTES[active.length] ?? []);
  return {
    ...getMoodFilters(active.mood, type),
    yearFrom,
    yearTo,
    countries: ORIGIN_COUNTRIES[active.origin] ?? [],
    minRuntime,
    maxRuntime,
    providerKeys: active.where ? [active.where] : [],
    providerAliases: PROVIDER_ALIASES,
  };
}

// Filtros para la base de datos (tus reseñas). null = sin filtro.
// En Reseñas, "musical" significa "tiene banda sonora" (no el mood guardado).
export function toReviewFilters(active) {
  const [yearFrom, yearTo] = ERA_YEARS[active.era] ?? [];
  const [minRuntime, maxRuntime] = LENGTH_MINUTES[active.length] ?? [];
  const soundtrack = active.mood === "musical";
  return {
    mood: soundtrack ? null : (active.mood ?? null),
    soundtrack,
    yearFrom: yearFrom ?? null,
    yearTo: yearTo ?? null,
    countries: ORIGIN_COUNTRIES[active.origin] ?? null,
    minRuntime: minRuntime ?? null,
    maxRuntime: maxRuntime ?? null,
  };
}

// Filtros que se muestran en Reseñas (sin "dónde verla").
export const REVIEW_SEGMENTS = ["mood", "origin", "era", "length"];
// En Series no va "duración" (la de un episodio no sirve para filtrar).
export const SERIES_SEGMENTS = ["mood", "origin", "era"];
// En Reseñas "musical" filtra por banda sonora, así que se muestra con otro texto.
export const REVIEW_LABELS = { mood: { musical: "con banda sonora" } };

// ---- Búsqueda y orden ----
// ?q=texto  -> búsqueda por título (máx. 100 caracteres)
export function readSearch(searchParams) {
  const q = searchParams?.q;
  return typeof q === "string" ? q.trim().slice(0, 100) : "";
}

// ?orden=...  -> orden de las reseñas (si no viene o no es válido: recientes)
export const REVIEW_SORTS = {
  recientes: "recientes",
  anio: "año",
  titulo: "título",
};

export function readSort(searchParams) {
  const value = searchParams?.orden;
  return REVIEW_SORTS[value] ? value : "recientes";
}

// Lo que NO es filtro pero hay que conservar en los links (búsqueda y orden).
export function extraParams(q, sort) {
  const extra = {};
  if (q) extra.q = q;
  if (sort && sort !== "recientes") extra.orden = sort;
  return extra;
}
