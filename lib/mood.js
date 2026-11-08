// Mapea los géneros (y opcionalmente keywords) que devuelve TMDB
// a uno de nuestros "estados de ánimo".

const GENRE_TO_MOOD = {
  27: "tension", // Horror
  80: "tension", // Crime
  53: "tension", // Thriller

  9648: "misteriosa", // Mystery

  18: "para-llorar", // Drama
  10752: "para-llorar", // War

  10749: "romantica", // Romance

  28: "adrenalina", // Action
  12: "adrenalina", // Adventure
  878: "adrenalina", // Science Fiction

  35: "para-reir", // Comedy
  10751: "para-reir", // Family
  16: "para-reir", // Animation

  99: "para-pensar", // Documentary
  36: "para-pensar", // History

  10402: "musical", // Music
};

// Géneros que existen solo en series (TMDB usa otros IDs para TV).
// Sirven para inferir el mood de una serie; los filtros de Descubrir series
// usan su propia tabla (MOOD_TO_TV_GENRES, más abajo).
const TV_GENRE_TO_MOOD = {
  10759: "adrenalina", // Action & Adventure
  10765: "adrenalina", // Sci-Fi & Fantasy
  10768: "para-pensar", // War & Politics
  10763: "para-pensar", // News
  10762: "para-reir", // Kids
  10764: "para-reir", // Reality
  10767: "para-reir", // Talk
  10766: "romantica", // Soap
};

export const MOOD_KEYWORDS = {
  "para-llorar": ["loss", "grief", "death", "terminal illness", "mourning"],
  "para-pensar": ["dystopia", "philosophy", "artificial intelligence"],
  nostalgica: ["coming of age", "nostalgia", "1980s", "childhood"],
  inspiradora: ["based on true story", "underdog", "overcoming adversity"],
  misteriosa: ["conspiracy", "detective", "investigation"],
};

const MOOD_PRIORITY = [
  "tension",
  "misteriosa",
  "para-llorar",
  "romantica",
  "adrenalina",
  "para-reir",
  "musical",
  "inspiradora",
  "nostalgica",
  "para-pensar",
];

export const MOOD_LABELS = {
  "para-llorar": "Para llorar",
  romantica: "Romántica",
  "para-reir": "Para reírme",
  adrenalina: "Adrenalina",
  tension: "Tensión",
  misteriosa: "Misteriosa",
  "para-pensar": "Para pensar",
  nostalgica: "Nostálgica",
  inspiradora: "Inspiradora",
  musical: "Musical",
};

export function inferMood(genreIds = [], keywords = []) {
  const candidateMoods = new Set(
    genreIds.map((id) => GENRE_TO_MOOD[id] ?? TV_GENRE_TO_MOOD[id]).filter(Boolean),
  );

  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  for (const [mood, moodKeywords] of Object.entries(MOOD_KEYWORDS)) {
    if (moodKeywords.some((kw) => lowerKeywords.includes(kw))) {
      candidateMoods.add(mood);
    }
  }

  for (const mood of MOOD_PRIORITY) {
    if (candidateMoods.has(mood)) return mood;
  }

  return "para-pensar";
}

export const MOOD_TO_GENRES = Object.entries(GENRE_TO_MOOD).reduce(
  (acc, [genreId, mood]) => {
    if (!acc[mood]) acc[mood] = [];
    acc[mood].push(Number(genreId));
    return acc;
  },
  {},
);

// Descubrir series: TMDB usa otros IDs de género en TV (no hay Terror, Thriller,
// Acción, Romance, Historia ni Música). Los moods que faltan acá usan keywords.
// No van Noticias, Reality ni Talk shows (se excluyen en lib/tmdb.js).
const MOOD_TO_TV_GENRES = {
  tension: [80], // Crime
  misteriosa: [9648], // Mystery
  "para-llorar": [18], // Drama
  adrenalina: [10759, 10765], // Action & Adventure, Sci-Fi & Fantasy
  "para-reir": [35, 10751, 16], // Comedy, Family, Animation
  "para-pensar": [99, 10768], // Documentary, War & Politics
};

// Keywords extra solo para series (en películas estos moods tienen género).
const TV_MOOD_KEYWORDS = {
  romantica: ["romance", "love"],
  musical: ["musical", "music"],
};

// Qué buscar en TMDB para un mood: sus géneros, o si no tiene,
// sus palabras clave (Nostálgica, Inspiradora; en series también Romántica y Musical).
// type = "movie" (por defecto) o "tv"
export function getMoodFilters(mood, type = "movie") {
  const isTv = type === "tv";
  const genreTable = isTv ? MOOD_TO_TV_GENRES : MOOD_TO_GENRES;
  const genreIds = mood ? (genreTable[mood] ?? []) : [];
  const keywordNames =
    mood && genreIds.length === 0
      ? ((isTv ? TV_MOOD_KEYWORDS[mood] : null) ?? MOOD_KEYWORDS[mood] ?? [])
      : [];
  return { genreIds, keywordNames };
}
