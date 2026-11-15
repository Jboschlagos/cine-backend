import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { getMovieDetails } from "@/lib/tmdb";
import { inferMood } from "@/lib/mood";
import { toEmbedUrl } from "@/lib/embed";
import { validImages } from "@/lib/reviewImages";

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
// body: { tmdb_id, media_type: "movie"|"tv", review_text, soundtrack_embed_url, images: [url, ...], ig_post_id? }
// Si viene ig_post_id (importación de Instagram), la reseña toma la fecha del post
// y el post queda marcado como "publicado".
// El orden de "images" es el orden del carrusel (la primera es la portada).
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { tmdb_id, review_text, soundtrack_embed_url, images = [], ig_post_id = null } = body;
  const mediaType = body.media_type === "tv" ? "tv" : "movie";
  if (ig_post_id !== null && !Number.isInteger(ig_post_id)) {
    return NextResponse.json({ error: "ig_post_id inválido" }, { status: 400 });
  }

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
      { error: "El soundtrack debe ser un link de Spotify o YouTube (video o playlist)" },
      { status: 400 },
    );
  }

  const movie = await getMovieDetails(tmdb_id, mediaType);
  const mood = inferMood(movie.genre_ids, movie.keywords);

  // Una sola consulta: crea la reseña y sus imágenes juntas (o ninguna si algo falla).
  // Fecha: la del post de IG si viene de una importación; si no, ahora.
  let createdAt = new Date().toISOString();
  if (ig_post_id !== null) {
    const ig = await sql`SELECT posted_at FROM ig_posts WHERE id = ${ig_post_id} AND status = 'pendiente'`;
    if (ig.length === 0) {
      return NextResponse.json({ error: "Ese post de IG no existe o ya fue publicado/descartado" }, { status: 409 });
    }
    createdAt = ig[0].posted_at;
  }

  const rows = await sql`
    WITH new_review AS (
      INSERT INTO reviews (
        tmdb_id, media_type, title, poster_url, release_year, genres,
        review_text, mood, soundtrack_embed_url, director, composer, actors,
        countries, runtime, created_at
      ) VALUES (
        ${movie.tmdb_id}, ${mediaType}, ${movie.title}, ${movie.poster_url}, ${movie.release_year},
        ${movie.genre_names}, ${review_text}, ${mood}, ${embedUrl},
        ${movie.director}, ${movie.composer}, ${movie.actors},
        ${movie.countries}, ${movie.runtime}, ${createdAt}
      )
      RETURNING *
    ),
    ig_done AS (
      UPDATE ig_posts SET status = 'publicado', review_id = (SELECT id FROM new_review)
      WHERE id = ${ig_post_id}
      RETURNING id
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
