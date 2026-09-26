import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { searchMovies } from "@/lib/tmdb";

// GET /api/movies/search?q=titulo  (solo admin, se usa desde /admin al crear una reseña)
export async function GET(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Parámetro 'q' requerido (mínimo 2 caracteres)" },
      { status: 400 }
    );
  }

  const results = await searchMovies(query.trim());
  return NextResponse.json(results);
}
