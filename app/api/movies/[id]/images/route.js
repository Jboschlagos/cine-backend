import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getMovieImages } from "@/lib/tmdb";

// GET /api/movies/:id/images  (solo admin)
// Devuelve los afiches disponibles en TMDB para elegir en el formulario.
export async function GET(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const type = new URL(request.url).searchParams.get("type") === "tv" ? "tv" : "movie";
  const posters = await getMovieImages(id, type);
  return NextResponse.json(posters.slice(0, 24));
}
