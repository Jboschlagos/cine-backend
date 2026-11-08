import Link from "next/link";
import { discoverMovies, searchMoviesPage } from "@/lib/tmdb";
import {
  readFilters,
  readMediaType,
  readSearch,
  toDiscoverFilters,
  toQuery,
  mediaTypeParams,
  DISCOVER_SEGMENTS,
} from "@/lib/filters";
import DiscoverGrid from "@/components/DiscoverGrid";
import MoodFilter from "@/components/MoodFilter";
import BrowseHeader, { RIGHT_COLUMN_CLASS } from "@/components/BrowseHeader";

const SORT_LABELS = {
  "popularity.desc": "más populares",
  "vote_average.desc": "mejor calificadas",
  "primary_release_date.desc": "más recientes",
  "first_air_date.desc": "más recientes",
};

export default async function DiscoverPage({ searchParams }) {
  const params = await searchParams;
  const type = readMediaType(params);
  const isTv = type === "tv";
  const noun = isTv ? "series" : "películas";
  const typeParams = mediaTypeParams(type); // {} o { tipo: "serie" }
  const segments = DISCOVER_SEGMENTS[type];
  const q = readSearch(params);
  // Si hay búsqueda, los filtros no aplican (TMDB no permite combinarlos).
  const active = q ? {} : readFilters(params, segments);
  const { results, sort_used, page, total_pages } = q
    ? await searchMoviesPage(q, 1, type)
    : await discoverMovies(toDiscoverFilters(active, type), { type });
  // query va a "Ver más" (/api/discover): filtros o búsqueda + el tipo.
  const query = q ? toQuery({ q, ...typeParams }) : toQuery({ ...active, ...typeParams });

  // Link para cambiar de tipo: conserva búsqueda y filtros que apliquen al otro tipo.
  const typeHref = (nextType) => {
    const allowed = DISCOVER_SEGMENTS[nextType];
    const kept = Object.fromEntries(Object.entries(active).filter(([name]) => allowed.includes(name)));
    const next = toQuery({ ...(q ? { q } : kept), ...mediaTypeParams(nextType) });
    return next ? `/discover?${next}` : "/discover";
  };
  const clearSearchHref = isTv ? `/discover?${toQuery(typeParams)}` : "/discover";

  return (
    <main>
      <BrowseHeader
        type={type}
        typeHref={typeHref}
        search={{
          action: "/discover",
          q,
          keep: typeParams,
          placeholder: isTv ? "Buscar cualquier serie" : "Buscar cualquier película",
        }}
        phraseRow={!q}
      >
        {q ? (
          <p className={`mx-auto max-w-2xl px-4 pb-6 pt-5 text-center font-display text-xs uppercase tracking-[0.2em] text-neutral-400 ${RIGHT_COLUMN_CLASS}`}>
            Resultados para “{q}” ·{" "}
            <Link href={clearSearchHref} className="border-b border-neutral-700 hover:text-white">
              Limpiar búsqueda
            </Link>
          </p>
        ) : (
          /* extra = el tipo: los links de los filtros y "Limpiar filtros" lo conservan */
          <MoodFilter
            basePath="/discover"
            prefix="Hoy quiero descubrir algo"
            active={active}
            segments={segments}
            extra={typeParams}
            className={RIGHT_COLUMN_CLASS}
            oneLineXl
          />
        )}
      </BrowseHeader>

      {!q && (
        // Cada visita elige al azar la página y el orden de TMDB; acá se dice cuál tocó.
        <p className="mx-auto max-w-2xl px-4 pb-6 text-center text-xs text-neutral-400">
          Todo al azar, para descubrir más allá de la taquilla · esta vez:{" "}
          {SORT_LABELS[sort_used] ?? sort_used}.
        </p>
      )}

      {results.length === 0 && (
        <p className="px-4 pb-6 text-center text-sm text-neutral-400">
          {q
            ? `No encontramos ${noun} con ese título.`
            : `No encontramos ${noun} con esa combinación. Prueba quitando algún filtro.`}
        </p>
      )}
      {/* "key" hace que la grilla parta de cero al cambiar el tipo, los filtros o la búsqueda */}
      <DiscoverGrid
        key={`${query}-${sort_used}-${page}`}
        initial={results}
        query={query}
        sort={sort_used}
        page={page}
        totalPages={total_pages}
        noun={noun}
      />
    </main>
  );
}
