import Link from "next/link";
import ReviewGrid from "@/components/ReviewGrid";
import MoodFilter from "@/components/MoodFilter";
import BrowseHeader, { RIGHT_COLUMN_CLASS } from "@/components/BrowseHeader";
import { getReviews } from "@/lib/reviews";
import {
  readFilters,
  readMediaType,
  readSearch,
  readSort,
  toReviewFilters,
  toQuery,
  extraParams,
  mediaTypeParams,
  REVIEW_SEGMENTS,
  SERIES_SEGMENTS,
  REVIEW_SORTS,
  REVIEW_LABELS,
} from "@/lib/filters";

const SEGMENTS = { movie: REVIEW_SEGMENTS, tv: SERIES_SEGMENTS };

// Listado de reseñas en "/" con selector Películas | Series (?tipo=serie),
// buscador, filtros, orden y "Ver más". Misma cabecera que Descubrir.
export default async function ReviewsIndex({ searchParams }) {
  const params = await searchParams;
  const mediaType = readMediaType(params);
  const isTv = mediaType === "tv";
  const segments = SEGMENTS[mediaType];
  const noun = isTv ? ["serie", "series"] : ["reseña", "reseñas"];
  const typeParams = mediaTypeParams(mediaType); // {} o { tipo: "serie" }
  const active = readFilters(params, segments);
  const q = readSearch(params);
  const sort = readSort(params);
  // Lo que no es filtro pero se conserva en todos los links: búsqueda, orden y tipo.
  const extra = { ...extraParams(q, sort), ...typeParams };

  const { reviews, total } = await getReviews(toReviewFilters(active), { q, sort, page: 1, mediaType });
  const hasFilters = Object.keys(active).length > 0 || q;
  const query = toQuery({ ...active, ...extra });
  const href = (values) => {
    const next = toQuery(values);
    return next ? `/?${next}` : "/";
  };

  // Link que cambia solo el orden y mantiene filtros, búsqueda y tipo.
  const sortHref = (key) => href({ ...active, ...extraParams(q, key), ...typeParams });

  // Link para cambiar de tipo: conserva búsqueda, orden y los filtros que apliquen al otro tipo.
  const typeHref = (nextType) => {
    const allowed = SEGMENTS[nextType];
    const kept = Object.fromEntries(Object.entries(active).filter(([name]) => allowed.includes(name)));
    return href({ ...kept, ...extraParams(q, sort), ...mediaTypeParams(nextType) });
  };

  return (
    <main>
      {/* Sin título visible (la cabecera parte directo, como en Descubrir).
          El h1 queda solo para lectores de pantalla y buscadores. */}
      <h1 className="sr-only">{isTv ? "Series" : "Reseñas"}</h1>

      {/* Al buscar se conservan los filtros, el orden y el tipo */}
      <BrowseHeader
        type={mediaType}
        typeHref={typeHref}
        search={{ action: "/", q, keep: { ...active, ...extraParams("", sort), ...typeParams } }}
      >
        <MoodFilter
          basePath="/"
          active={active}
          extra={extra}
          segments={segments}
          labels={REVIEW_LABELS}
          className={RIGHT_COLUMN_CLASS}
          oneLineXl
        />
      </BrowseHeader>

      {/* Contador + orden */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 pb-4 font-display text-[10px] uppercase tracking-[0.2em] text-neutral-500">
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
        <p className="p-4 text-center font-display text-xs uppercase tracking-[0.15em] text-neutral-400">
          {hasFilters ? `No hay ${noun[1]} con esa combinación. Prueba con otra.` : `Todavía no hay ${noun[1]}.`}
        </p>
      ) : (
        // "key" hace que la grilla parta de cero al cambiar tipo, filtros, búsqueda u orden
        <ReviewGrid key={query} initial={reviews} query={query} total={total} mediaType={mediaType} />
      )}
    </main>
  );
}
