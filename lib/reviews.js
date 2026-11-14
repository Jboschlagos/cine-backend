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

// ¿Cuáles de estas películas/series (ids de TMDB) ya reseñaste?
// Devuelve un Map: tmdb_id -> id de tu reseña. Lo usa Descubrir para marcar "Ya reseñada".
export async function getReviewedTmdbIds(tmdbIds, mediaType = "movie") {
  if (tmdbIds.length === 0) return new Map();
  const rows = await sql`
    SELECT DISTINCT ON (tmdb_id) tmdb_id, id FROM reviews
    WHERE media_type = ${mediaType} AND tmdb_id = ANY(${tmdbIds}::int[])
    ORDER BY tmdb_id, created_at DESC
  `;
  return new Map(rows.map((r) => [r.tmdb_id, r.id]));
}

// ---- "Si te gustó esta…" ----
// Puntos por cada cosa en común con la reseña de base (solo con tus reseñas, sin APIs externas).
export const SIMILAR_POINTS = {
  director: 5, // mismo director (en series: creador)
  composer: 4, // mismo compositor
  actor: 3, // por CADA actor en común
  mood: 2, // mismo mood
  genre: 1, // por CADA género en común
  decade: 1, // misma década
};
// Puntaje mínimo para contar como parecida (ej. un solo género en común no alcanza).
export const SIMILAR_MIN_SCORE = 3;

// Las reseñas más parecidas a la reseña "id", del mismo tipo (película o serie).
// Devuelve [] si ninguna llega al mínimo. Cada una trae images (solo la portada) para ReviewCard.
export async function getSimilarReviews(id, limit = 4) {
  const p = SIMILAR_POINTS;
  // "base" = la reseña que estás viendo. "&&" = tienen algún elemento en común.
  // unnest() convierte una lista en filas, para contar cuántos actores/géneros comparten.
  const rows = await sql`
    WITH base AS (SELECT * FROM reviews WHERE id = ${id}),
    scored AS (
      SELECT r.*,
        (CASE WHEN string_to_array(r.director, ', ') && string_to_array(b.director, ', ') THEN ${p.director} ELSE 0 END)
        + (CASE WHEN string_to_array(r.composer, ', ') && string_to_array(b.composer, ', ') THEN ${p.composer} ELSE 0 END)
        + ${p.actor} * (SELECT count(*) FROM unnest(r.actors) a WHERE a = ANY(b.actors))
        + (CASE WHEN r.mood = b.mood THEN ${p.mood} ELSE 0 END)
        + ${p.genre} * (SELECT count(*) FROM unnest(r.genres) g WHERE g = ANY(b.genres))
        + (CASE WHEN r.release_year / 10 = b.release_year / 10 THEN ${p.decade} ELSE 0 END)
        AS score
      FROM reviews r, base b
      WHERE r.id <> b.id AND r.media_type = b.media_type
    )
    SELECT scored.*,
      (SELECT image_url FROM review_images WHERE review_id = scored.id ORDER BY position LIMIT 1) AS cover
    FROM scored
    WHERE score >= ${SIMILAR_MIN_SCORE}
    ORDER BY score DESC, created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(({ cover, ...review }) => ({
    ...review,
    images: cover ? [{ image_url: cover }] : [],
  }));
}

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
  // director y composer se guardan como "Joel Coen, Ethan Coen": string_to_array los separa
  // y "= ANY(...)" pide que el nombre buscado sea uno de ellos (coincidencia exacta).
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
      AND (${f.director ?? null}::text IS NULL OR ${f.director ?? null} = ANY(string_to_array(director, ', ')))
      AND (${f.composer ?? null}::text IS NULL OR ${f.composer ?? null} = ANY(string_to_array(composer, ', ')))
      AND (${f.actor ?? null}::text IS NULL OR ${f.actor ?? null} = ANY(actors))
      AND (${f.genre ?? null}::text IS NULL OR ${f.genre ?? null} = ANY(genres))
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
