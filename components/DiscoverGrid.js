"use client";

import { useState } from "react";
import DiscoverCard from "@/components/DiscoverCard";

// Grilla de Descubrir con botón "Ver más": pide la página siguiente
// de TMDB (mismos filtros y mismo orden) y la suma al final, sin repetir.
export default function DiscoverGrid({ initial, query, sort, page, totalPages }) {
  const [movies, setMovies] = useState(initial);
  const [nextPage, setNextPage] = useState(page + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMore = nextPage <= Math.min(totalPages, 500); // TMDB no da más de 500 páginas

  async function loadMore() {
    setLoading(true);
    setError("");
    // query = filtros activos, ej. "mood=tension&era=80s", o la búsqueda "q=alien"
    const params = new URLSearchParams(query);
    if (sort) params.set("sort", sort); // en una búsqueda (?q=) no hay orden
    params.set("page", String(nextPage));

    const res = await fetch(`/api/discover?${params}`);
    setLoading(false);
    if (!res.ok) return setError("No se pudieron cargar más películas. Intenta de nuevo.");

    const data = await res.json();
    setMovies((prev) => {
      const seen = new Set(prev.map((m) => m.tmdb_id));
      return [...prev, ...data.results.filter((m) => !seen.has(m.tmdb_id))];
    });
    setNextPage((n) => n + 1);
  }

  return (
    <>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {movies.map((movie) => (
          <DiscoverCard key={movie.tmdb_id} movie={movie} />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 px-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="border-b border-neutral-600 pb-1 font-display text-xs uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:border-white hover:text-white disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Ver más"}
          </button>
        ) : (
          movies.length > 0 && (
            <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-600">Fin</p>
          )
        )}
      </div>
    </>
  );
}
