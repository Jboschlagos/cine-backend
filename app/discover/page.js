import { discoverMovies } from "@/lib/tmdb";
import { MOOD_TO_GENRES } from "@/lib/mood";
import DiscoverCard from "@/components/DiscoverCard";
import MoodFilter from "@/components/MoodFilter";

const SORT_LABELS = {
  "popularity.desc": "más populares",
  "vote_average.desc": "mejor calificadas",
  "primary_release_date.desc": "más recientes",
};

export default async function DiscoverPage({ searchParams }) {
  const { mood } = await searchParams;
  const genreIds = mood ? (MOOD_TO_GENRES[mood] ?? []) : [];

  const { results, sort_used } = await discoverMovies(genreIds);

  return (
    <main>
      <MoodFilter activeMood={mood} basePath="/discover" />
      <p className="px-4 pb-2 text-sm text-neutral-400">
        Esta selección es aleatoria — cada vez que entrás acá te mostramos una
        combinación distinta de página y criterio de orden (esta vez:{" "}
        {SORT_LABELS[sort_used] ?? sort_used}), para que sea un lugar de
        descubrir y no siempre las mismas películas de taquilla.
      </p>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
        {results.map((movie) => (
          <DiscoverCard key={movie.tmdb_id} movie={movie} />
        ))}
      </div>
    </main>
  );
}
