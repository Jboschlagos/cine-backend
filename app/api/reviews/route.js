import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { getMovieDetails } from "@/lib/tmdb";
import { inferMood } from "@/lib/mood";
import { toEmbedUrl } from "@/lib/embed";

const ALLOWED_IMAGE_HOSTS = ["image.tmdb.org", "res.cloudinary.com"];
const MAX_IMAGES = 10;

// Solo aceptamos entre 1 y 10 URLs https de TMDB o Cloudinary.
function validImages(images) {
  if (
    !Array.isArray(images) ||
    images.length === 0 ||
    images.length > MAX_IMAGES
  )
    return false;
  return images.every((u) => {
    try {
      const url = new URL(u);
      return (
        url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(url.hostname)
      );
    } catch {
      return false;
    }
  });
}

// GET /api/reviews            -> lista el feed
// GET /api/reviews?mood=xxx   -> filtra por estado de ánimo
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mood = searchParams.get("mood");

  const rows = mood
    ? await sql`SELECT * FROM reviews WHERE mood = ${mood} ORDER BY created_at DESC`
    : await sql`SELECT * FROM reviews ORDER BY created_at DESC`;

  return NextResponse.json(rows);
}

// POST /api/reviews  (solo admin)
// body: { tmdb_id, review_text, soundtrack_embed_url, images: [url, ...] }
// El orden de "images" es el orden del carrusel (la primera es la portada).
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { tmdb_id, review_text, soundtrack_embed_url, images = [] } = body;

  if (!tmdb_id || !review_text) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: tmdb_id, review_text" },
      { status: 400 },
    );
  }
  if (!validImages(images)) {
    return NextResponse.json(
      {
        error:
          "images debe tener entre 1 y 10 URLs https de TMDB o Cloudinary",
      },
      { status: 400 },
    );
  }

  // Guardamos siempre la URL de embed; si el link no es de Spotify/YouTube, error.
  const embedUrl = soundtrack_embed_url
    ? toEmbedUrl(soundtrack_embed_url)
    : null;
  if (soundtrack_embed_url && !embedUrl) {
    return NextResponse.json(
      { error: "El soundtrack debe ser un link de Spotify o YouTube" },
      { status: 400 },
    );
  }

  const movie = await getMovieDetails(tmdb_id);
  const mood = inferMood(movie.genre_ids, movie.keywords);

  // Una sola consulta: crea la reseña y sus imágenes juntas (o ninguna si algo falla).
  const rows = await sql`
    WITH new_review AS (
      INSERT INTO reviews (
        tmdb_id, title, poster_url, release_year, genres,
        review_text, mood, soundtrack_embed_url
      ) VALUES (
        ${movie.tmdb_id}, ${movie.title}, ${movie.poster_url}, ${movie.release_year},
        ${movie.genre_names}, ${review_text}, ${mood}, ${embedUrl}
      )
      RETURNING *
    ),
    new_images AS (
      INSERT INTO review_images (review_id, image_url, position)
      SELECT new_review.id, u.url, u.ord - 1
      FROM new_review, unnest(${images}::text[]) WITH ORDINALITY AS u(url, ord)
      RETURNING id
    )
    SELECT * FROM new_review
  `;

  return NextResponse.json({ ...rows[0], images }, { status: 201 });
}
