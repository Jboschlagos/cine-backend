import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { getMovieDetails } from "@/lib/tmdb";
import { inferMood, MOOD_LABELS } from "@/lib/mood";
import { toEmbedUrl } from "@/lib/embed";
import { validImages } from "@/lib/reviewImages";

// GET /api/reviews/:id -> detalle de una reseña (incluye sus comentarios)
export async function GET(_request, { params }) {
  const { id } = await params;

  const reviewRows = await sql`SELECT * FROM reviews WHERE id = ${id}`;
  if (reviewRows.length === 0) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const comments = await sql`
    SELECT * FROM comments WHERE review_id = ${id} ORDER BY created_at ASC
  `;

  return NextResponse.json({ ...reviewRows[0], comments });
}

// PUT /api/reviews/:id  (solo admin)
// body: cualquier parte de
//   { review_text, soundtrack_embed_url, mood, created_at, images: [url, ...], tmdb_id, media_type }
// Lo que no venga se deja como está. soundtrack_embed_url: "" o null = quitarla.
// Si cambia la película/serie (tmdb_id o media_type), se vuelven a traer sus datos de TMDB.
export async function PUT(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const [current] = await sql`SELECT * FROM reviews WHERE id = ${id}`;
  if (!current) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const bad = (error) => NextResponse.json({ error }, { status: 400 });
  const next = { ...current };

  if ("review_text" in body) {
    if (typeof body.review_text !== "string" || !body.review_text.trim()) return bad("La reseña no puede quedar vacía");
    next.review_text = body.review_text.trim();
  }

  if ("soundtrack_embed_url" in body) {
    const link = body.soundtrack_embed_url?.trim?.() || null;
    const embed = link ? toEmbedUrl(link) : null;
    if (link && !embed) return bad("El soundtrack debe ser un link de Spotify o YouTube");
    next.soundtrack_embed_url = embed;
  }

  if ("created_at" in body) {
    const date = new Date(body.created_at);
    if (Number.isNaN(date.getTime())) return bad("Fecha inválida");
    next.created_at = date.toISOString();
  }

  const replaceImages = "images" in body;
  if (replaceImages && !validImages(body.images)) {
    return bad("images debe tener entre 1 y 10 URLs https de TMDB o Cloudinary");
  }

  // ¿Cambió la película o serie?
  const mediaType = body.media_type === "tv" || body.media_type === "movie" ? body.media_type : current.media_type;
  const tmdbId = body.tmdb_id ?? current.tmdb_id;
  const movieChanged = Number(tmdbId) !== current.tmdb_id || mediaType !== current.media_type;
  if (movieChanged) {
    let movie;
    try {
      movie = await getMovieDetails(tmdbId, mediaType);
    } catch {
      return NextResponse.json({ error: "No se pudo consultar TMDB" }, { status: 502 });
    }
    Object.assign(next, {
      tmdb_id: movie.tmdb_id,
      media_type: mediaType,
      title: movie.title,
      poster_url: movie.poster_url,
      release_year: movie.release_year,
      genres: movie.genre_names,
      director: movie.director,
      composer: movie.composer,
      actors: movie.actors,
      countries: movie.countries,
      runtime: movie.runtime,
      mood: inferMood(movie.genre_ids, movie.keywords), // si no eliges uno abajo
    });
  }

  if ("mood" in body && body.mood) {
    if (!MOOD_LABELS[body.mood]) return bad("Mood inválido");
    next.mood = body.mood;
  }

  // Una sola consulta: actualiza la reseña y, si vienen, reemplaza sus imágenes.
  const images = replaceImages ? body.images : [];
  const rows = await sql`
    WITH updated AS (
      UPDATE reviews SET
        tmdb_id = ${next.tmdb_id}, media_type = ${next.media_type}, title = ${next.title},
        poster_url = ${next.poster_url}, release_year = ${next.release_year}, genres = ${next.genres},
        review_text = ${next.review_text}, mood = ${next.mood},
        soundtrack_embed_url = ${next.soundtrack_embed_url},
        director = ${next.director}, composer = ${next.composer}, actors = ${next.actors},
        countries = ${next.countries}, runtime = ${next.runtime}, created_at = ${next.created_at}
      WHERE id = ${id}
      RETURNING *
    ),
    removed AS (
      DELETE FROM review_images WHERE review_id = ${id} AND ${replaceImages}
    ),
    added AS (
      INSERT INTO review_images (review_id, image_url, position)
      SELECT ${id}, u.url, u.ord - 1
      FROM unnest(${images}::text[]) WITH ORDINALITY AS u(url, ord)
      WHERE ${replaceImages}
    )
    SELECT * FROM updated
  `;

  return NextResponse.json(rows[0]);
}

// DELETE /api/reviews/:id  (solo admin)
// Borra la reseña con sus imágenes y comentarios. Si venía de Instagram,
// el post vuelve a "Pendientes" para poder publicarlo de nuevo.
export async function DELETE(_request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  await sql`
    WITH back_to_pending AS (
      UPDATE ig_posts SET status = 'pendiente', review_id = NULL WHERE review_id = ${id}
    )
    DELETE FROM reviews WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true });
}
