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

const MOOD_KEYWORDS = {
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
    genreIds.map((id) => GENRE_TO_MOOD[id]).filter(Boolean),
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
