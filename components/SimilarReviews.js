import ReviewCard from "@/components/ReviewCard";

// "Si te gustó esta película…": tus reseñas más parecidas (ver getSimilarReviews en lib/reviews.js).
// Si no hay ninguna, la sección no aparece.
export default function SimilarReviews({ reviews, mediaType, className = "" }) {
  if (reviews.length === 0) return null;

  return (
    <section className={`border-t border-neutral-800 pt-6 ${className}`}>
      <h2 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-neutral-400">
        Si te gustó esta {mediaType === "tv" ? "serie" : "película"}…
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
