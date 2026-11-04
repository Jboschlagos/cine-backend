"use client";

import { useState } from "react";
import ReviewCard from "@/components/ReviewCard";

// Grilla de Reseñas con botón "Ver más": pide la página siguiente
// a /api/feed (mismos filtros, búsqueda y orden) y la suma al final.
// mediaType="tv" en la página de Series.
export default function ReviewGrid({ initial, query, total, mediaType = "movie" }) {
  const [reviews, setReviews] = useState(initial);
  const [nextPage, setNextPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMore = reviews.length < total;

  async function loadMore() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams(query); // ej. "mood=tension&orden=anio"
    params.set("page", String(nextPage));
    if (mediaType === "tv") params.set("tipo", "serie");

    const res = await fetch(`/api/feed?${params}`);
    setLoading(false);
    if (!res.ok) return setError("No se pudieron cargar más reseñas. Intenta de nuevo.");

    const data = await res.json();
    setReviews((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...data.reviews.filter((r) => !seen.has(r.id))];
    });
    setNextPage((n) => n + 1);
  }

  return (
    <>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex flex-col items-center gap-3 px-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="border-b border-neutral-600 pb-1 font-display text-xs uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:border-white hover:text-white disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Ver más"}
          </button>
        </div>
      )}
    </>
  );
}
