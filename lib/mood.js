// Mapea los géneros (y opcionalmente keywords) que devuelve TMDB
// a uno de nuestros "estados de ánimo".
//
// TMDB no tiene un campo de "mood", así que esto es una heurística:
// cada género apunta a un mood, y cuando una película tiene varios
// géneros se resuelve por prioridad (la lista MOOD_PRIORITY de abajo).
// Se puede ajustar libremente sin tocar el resto del sistema.

const GENRE_TO_MOOD = {
  18: "para-llorar", // Drama
  10749: "para-llorar", // Romance
  10752: "para-llorar", // War

  35: "para-reir", // Comedy
  10751: "para-reir", // Family
  16: "para-reir", // Animation

  28: "adrenalina", // Action
  12: "adrenalina", // Adventure
  878: "adrenalina", // Science Fiction

  27: "tension", // Horror
  9648: "tension", // Mystery
  80: "tension", // Crime
  53: "tension", // Thriller

  99: "para-pensar", // Documentary
  36: "para-pensar", // History

  10402: "nostalgica", // Music
};

// Si un mood podría salir de varios géneros a la vez, este orden
// decide cuál gana (de más a menos prioritario).
const MOOD_PRIORITY = [
  "tension",
  "para-llorar",
  "adrenalina",
  "para-reir",
  "para-pensar",
  "nostalgica",
];

// Palabras clave (en inglés, como las entrega TMDB) que refuerzan
// "para-llorar" incluso si el género principal no es Drama.
const GRIEF_KEYWORDS = ["loss", "grief", "death", "terminal illness", "mourning"];

export const MOOD_LABELS = {
  "para-llorar": "Para llorar",
  "para-reir": "Para reírme",
  adrenalina: "Adrenalina",
  tension: "Tensión",
  "para-pensar": "Para pensar",
  nostalgica: "Nostálgica",
};

/**
 * @param {number[]} genreIds - genre_ids que devuelve TMDB
 * @param {string[]} [keywords] - nombres de keywords que devuelve TMDB (opcional)
 * @returns {string} uno de los moods definidos arriba
 */
export function inferMood(genreIds = [], keywords = []) {
  const candidateMoods = new Set(
    genreIds.map((id) => GENRE_TO_MOOD[id]).filter(Boolean)
  );

  const hasGriefKeyword = keywords.some((k) =>
    GRIEF_KEYWORDS.includes(k.toLowerCase())
  );
  if (hasGriefKeyword) candidateMoods.add("para-llorar");

  for (const mood of MOOD_PRIORITY) {
    if (candidateMoods.has(mood)) return mood;
  }

  return "para-pensar"; // fallback si no matchea ningún género conocido
}
