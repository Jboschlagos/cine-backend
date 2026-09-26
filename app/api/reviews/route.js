import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { getMovieDetails } from "@/lib/tmdb";
import { inferMood } from "@/lib/mood";

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
// body: { tmdb_id, review_text, soundtrack_embed_url }
// El resto de los datos de la película (título, afiche, mood) se
// completan automáticamente consultando TMDB.
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { tmdb_id, review_text, soundtrack_embed_url } = body;

  if (!tmdb_id || !review_text) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: tmdb_id, review_text" },
      { status: 400 }
    );
  }

  const movie = await getMovieDetails(tmdb_id);
  const mood = inferMood(movie.genre_ids, movie.keywords);

  const rows = await sql`
    INSERT INTO reviews (
      tmdb_id, title, poster_url, release_year, genres,
      review_text, mood, soundtrack_embed_url
    ) VALUES (
      ${movie.tmdb_id}, ${movie.title}, ${movie.poster_url}, ${movie.release_year},
      ${movie.genre_names}, ${review_text}, ${mood}, ${soundtrack_embed_url ?? null}
    )
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
