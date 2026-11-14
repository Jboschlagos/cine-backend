import Link from "next/link";
import MovieSheet from "@/components/MovieSheet";
import PosterFace, { POSTER_CARD_CLASS } from "@/components/PosterFace";
import { inferMood, MOOD_LABELS } from "@/lib/mood";

// Tarjeta de Descubrir: al hacer clic en el afiche se abre la ficha técnica.
// Si ya la reseñaste (movie.reviewed_id), lleva a tu reseña y dice "Ya reseñada".
export default function DiscoverCard({ movie }) {
  const mood = MOOD_LABELS[inferMood(movie.genre_ids ?? [])];
  const face = (
    <PosterFace
      image={movie.poster_url}
      title={movie.title}
      rows={[
        ["año", movie.release_year],
        ["mood", mood],
        ["nota", movie.vote_average ? `★ ${movie.vote_average.toFixed(1)}` : null],
      ]}
    />
  );

  if (movie.reviewed_id) {
    return (
      <Link href={`/reviews/${movie.reviewed_id}`} className={POSTER_CARD_CLASS}>
        {face}
        <span className="absolute left-2 top-2 bg-black/85 px-2 py-1 font-display text-[10px] uppercase tracking-[0.2em] text-white">
          Ya reseñada
        </span>
      </Link>
    );
  }

  return (
    // media_type = "movie" o "tv": la ficha pide /movie o /tv según corresponda
    <MovieSheet tmdbId={movie.tmdb_id} mediaType={movie.media_type} className={POSTER_CARD_CLASS}>
      {face}
    </MovieSheet>
  );
}
