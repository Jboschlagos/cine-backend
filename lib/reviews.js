import { cache } from "react";
import { sql } from "@/lib/db";

export const REVIEWS_PER_PAGE = 20;

// Una reseña por id (o null si no existe).
// cache() = si generateMetadata y la página la piden en la misma visita,
// la base de datos se consulta una sola vez.
export const getReview = cache(async (id) => {
  const [review] = await sql`SELECT * FROM reviews WHERE id = ${id}`;
  return review ?? null;
});

// URLs de las imágenes de una reseña, en orden de carrusel (la primera es la portada).
export const getReviewImages = cache(async (id) => {
  const rows = await sql`SELECT image_url FROM review_images WHERE review_id = ${id} ORDER BY position ASC`;
  return rows.map((r) => r.image_url);
});

// Reseñas filtradas, buscadas, ordenadas y paginadas (con sus imágenes).
// f = resultado de toReviewFilters(); devuelve { reviews, total }.
// mediaType = "movie" (Reseñas) o "tv" (Series).
// La usan Reseñas, Series y GET /api/feed ("Ver más").
export async function getReviews(f, { q = "", sort = "recientes", page = 1, mediaType = "movie" } = {}) {
  const offset = (page - 1) * REVIEWS_PER_PAGE;
  // Escapamos % y _ para que se busquen como texto normal.
  const like = q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : null;

  // Cada condición se ignora si su filtro viene vacío (null).
  // "&&" en Postgres = "tienen algún país en común".
  // count(*) OVER() = total de resultados sin el LIMIT (para el contador).
  const rows = await sql`
    SELECT *, count(*) OVER()::int AS total FROM reviews
    WHERE media_type = ${mediaType}
      AND (${f.mood}::text IS NULL OR mood = ${f.mood})
      AND (${f.soundtrack}::boolean IS NOT TRUE OR COALESCE(soundtrack_embed_url, '') <> '')
      AND (${f.yearFrom}::int IS NULL OR release_year >= ${f.yearFrom})
      AND (${f.yearTo}::int IS NULL OR release_year <= ${f.yearTo})
      AND (${f.countries}::text[] IS NULL OR countries && ${f.countries}::text[])
      AND (${f.minRuntime}::int IS NULL OR runtime >= ${f.minRuntime})
      AND (${f.maxRuntime}::int IS NULL OR runtime <= ${f.maxRuntime})
      AND (${like}::text IS NULL OR title ILIKE ${like})
    ORDER BY
      CASE WHEN ${sort} = 'anio' THEN release_year END DESC NULLS LAST,
      CASE WHEN ${sort} = 'titulo' THEN lower(title) END ASC,
      created_at DESC,
      id DESC
    LIMIT ${REVIEWS_PER_PAGE} OFFSET ${offset}
  `;
  if (rows.length === 0) return { reviews: [], total: 0 };

  const images = await sql`
    SELECT * FROM review_images
    WHERE review_id = ANY(${rows.map((r) => r.id)})
    ORDER BY position ASC
  `;
  const reviews = rows.map(({ total, ...review }) => ({
    ...review,
    images: images.filter((img) => img.review_id === review.id),
  }));

  return { reviews, total: rows[0].total };
}
