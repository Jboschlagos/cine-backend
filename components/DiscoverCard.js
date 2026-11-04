import MovieSheet from "@/components/MovieSheet";
import PosterFace, { POSTER_CARD_CLASS } from "@/components/PosterFace";
import { inferMood, MOOD_LABELS } from "@/lib/mood";

// Tarjeta de Descubrir: al hacer clic en el afiche se abre la ficha técnica.
export default function DiscoverCard({ movie }) {
  const mood = MOOD_LABELS[inferMood(movie.genre_ids ?? [])];

  return (
    <MovieSheet tmdbId={movie.tmdb_id} className={POSTER_CARD_CLASS}>
      <PosterFace
        image={movie.poster_url}
        title={movie.title}
        rows={[
          ["año", movie.release_year],
          ["mood", mood],
          ["nota", movie.vote_average ? `★ ${movie.vote_average.toFixed(1)}` : null],
        ]}
      />
    </MovieSheet>
  );
}
