import Link from "next/link";
import ReviewGrid from "@/components/ReviewGrid";
import MoodFilter from "@/components/MoodFilter";
import SearchBox from "@/components/SearchBox";
import { getReviews } from "@/lib/reviews";
import {
  readFilters,
  readSearch,
  readSort,
  toReviewFilters,
  toQuery,
  extraParams,
  REVIEW_SEGMENTS,
  SERIES_SEGMENTS,
  REVIEW_SORTS,
  REVIEW_LABELS,
} from "@/lib/filters";

// Listado de reseñas con buscador, filtros, orden y "Ver más".
// Lo usan Reseñas (mediaType="movie", en "/") y Series (mediaType="tv", en "/series").
export default async function ReviewsIndex({ searchParams, mediaType = "movie", basePath = "/", heading, intro }) {
  const isTv = mediaType === "tv";
  const segments = isTv ? SERIES_SEGMENTS : REVIEW_SEGMENTS;
  const noun = isTv ? ["serie", "series"] : ["reseña", "reseñas"];
  const params = await searchParams;
  const active = readFilters(params, segments);
  const q = readSearch(params);
  const sort = readSort(params);
  const extra = extraParams(q, sort);

  const { reviews, total } = await getReviews(toReviewFilters(active), { q, sort, page: 1, mediaType });
  const hasFilters = Object.keys(active).length > 0 || q;
  const query = toQuery({ ...active, ...extra });

  // Link que cambia solo el orden y mantiene filtros y búsqueda.
  const sortHref = (key) => {
    const next = toQuery({ ...active, ...extraParams(q, key) });
    return next ? `${basePath}?${next}` : basePath;
  };

  return (
    <main>
      {/* Mini introducción: solo texto, con mucho aire alrededor */}
      <section className="mx-auto max-w-3xl px-4 pt-8 text-center sm:pt-12">
        <h1 className="font-display text-lg font-normal uppercase leading-snug tracking-[0.25em] text-white sm:text-2xl">
          {heading}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-neutral-500 sm:text-sm">
          {intro}
        </p>
      </section>

      {/* Al buscar se conservan los filtros y el orden */}
      <SearchBox action={basePath} q={q} keep={{ ...active, ...extraParams("", sort) }} />
      <MoodFilter basePath={basePath} active={active} extra={extra} segments={segments} labels={REVIEW_LABELS} />

      {/* Contador + orden */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 pb-4 font-display text-[10px] uppercase tracking-[0.2em] text-neutral-600">
        <span>
          {total} {total === 1 ? noun[0] : noun[1]}
          {q && <> para “{q}”</>}
        </span>
        <span className="flex gap-3">
          Ordenar:
          {Object.entries(REVIEW_SORTS).map(([key, label]) => (
            <Link
              key={key}
              href={sortHref(key)}
              aria-current={sort === key ? "true" : undefined}
              className={sort === key ? "text-white" : "hover:text-white"}
            >
              {label}
            </Link>
          ))}
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="p-4 text-center font-display text-xs uppercase tracking-[0.15em] text-neutral-500">
          {hasFilters ? `No hay ${noun[1]} con esa combinación. Prueba con otra.` : `Todavía no hay ${noun[1]}.`}
        </p>
      ) : (
        // "key" hace que la grilla parta de cero al cambiar filtros, búsqueda u orden
        <ReviewGrid key={query} initial={reviews} query={query} total={total} mediaType={mediaType} />
      )}
    </main>
  );
}
