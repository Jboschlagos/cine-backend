import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import DiscoverGrid from "@/components/DiscoverGrid";

const HEADING_CLASS = "mb-4 font-display text-sm uppercase tracking-[0.2em] text-neutral-400";
const GRID_CLASS = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
const NOTE_CLASS = "font-display text-xs uppercase tracking-[0.15em] text-neutral-500";

// Vista de persona en Descubrir (/discover?persona=…&rol=…):
// 1) tus reseñas con esa persona; 2) más de ella en TMDB (sin las que ya reseñaste).
// mine = { reviews, total } de getReviews; allHref = la portada filtrada por esa persona.
export default function PersonResults({ name, mine, allHref, tmdbResults, noun, personKey }) {
  return (
    <div className="flex flex-col gap-10">
      <section className="mx-auto w-full max-w-6xl px-4">
        <h2 className={HEADING_CLASS}>En mis reseñas</h2>
        {mine.reviews.length > 0 ? (
          <>
            <div className={GRID_CLASS}>
              {mine.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            {mine.total > mine.reviews.length && (
              <Link href={allHref} className={`mt-4 inline-block border-b border-neutral-700 hover:text-white ${NOTE_CLASS}`}>
                Ver todas en mis reseñas →
              </Link>
            )}
          </>
        ) : (
          <p className={NOTE_CLASS}>Todavía no reseño nada con {name}.</p>
        )}
      </section>

      <section>
        <h2 className={`mx-auto max-w-6xl px-4 ${HEADING_CLASS}`}>Más de {name}</h2>
        {tmdbResults.length > 0 ? (
          // Todo llega de una vez: "Ver más" muestra de a 40 sin volver a pedir a TMDB
          <DiscoverGrid
            key={personKey}
            initial={tmdbResults}
            query=""
            sort={null}
            page={1}
            totalPages={1}
            noun={noun}
            localPageSize={40}
          />
        ) : (
          <p className={`mx-auto max-w-6xl px-4 ${NOTE_CLASS}`}>
            No encontramos más {noun} de {name} en TMDB.
          </p>
        )}
      </section>
    </div>
  );
}
