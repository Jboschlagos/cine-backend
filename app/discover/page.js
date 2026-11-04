import Link from "next/link";
import { discoverMovies, searchMoviesPage } from "@/lib/tmdb";
import { readFilters, readSearch, toDiscoverFilters, toQuery } from "@/lib/filters";
import DiscoverGrid from "@/components/DiscoverGrid";
import MoodFilter from "@/components/MoodFilter";
import SearchBox from "@/components/SearchBox";

const SORT_LABELS = {
  "popularity.desc": "más populares",
  "vote_average.desc": "mejor calificadas",
  "primary_release_date.desc": "más recientes",
};

export default async function DiscoverPage({ searchParams }) {
  const params = await searchParams;
  const q = readSearch(params);
  // Si hay búsqueda, los filtros no aplican (TMDB no permite combinarlos).
  const active = q ? {} : readFilters(params);
  const { results, sort_used, page, total_pages } = q
    ? await searchMoviesPage(q)
    : await discoverMovies(toDiscoverFilters(active));
  const query = q ? toQuery({ q }) : toQuery(active);

  return (
    <main>
      <SearchBox action="/discover" q={q} placeholder="Buscar cualquier película" />

      {q ? (
        <p className="mx-auto max-w-2xl px-4 pb-6 pt-5 text-center font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
          Resultados para “{q}” ·{" "}
          <Link href="/discover" className="border-b border-neutral-700 hover:text-white">
            Limpiar búsqueda
          </Link>
        </p>
      ) : (
        <>
          <MoodFilter
            basePath="/discover"
            prefix="Hoy quiero descubrir algo"
            active={active}
            segments={["mood", "origin", "era", "length", "where"]}
          />
          <p className="mx-auto max-w-2xl px-4 pb-6 text-center text-xs text-neutral-500">
            Esta selección es aleatoria — cada vez que entras acá te mostramos una
            combinación distinta de página y criterio de orden (esta vez:{" "}
            {SORT_LABELS[sort_used] ?? sort_used}), para que sea un lugar de
            descubrir y no siempre las mismas películas de taquilla.
          </p>
        </>
      )}

      {results.length === 0 && (
        <p className="px-4 pb-6 text-center text-sm text-neutral-500">
          {q
            ? "No encontramos películas con ese título."
            : "No encontramos películas con esa combinación. Prueba quitando algún filtro."}
        </p>
      )}
      {/* "key" hace que la grilla parta de cero al cambiar los filtros o la búsqueda */}
      <DiscoverGrid
        key={`${query}-${sort_used}-${page}`}
        initial={results}
        query={query}
        sort={sort_used}
        page={page}
        totalPages={total_pages}
      />
    </main>
  );
}
