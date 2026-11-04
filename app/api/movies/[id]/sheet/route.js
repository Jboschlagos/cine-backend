import { NextResponse } from "next/server";
import { getMovieSheet } from "@/lib/tmdb";
import { inferMood, MOOD_LABELS } from "@/lib/mood";

// GET /api/movies/:id/sheet[?type=tv]  (público) -> ficha técnica para la ventana emergente
export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const type = new URL(request.url).searchParams.get("type") === "tv" ? "tv" : "movie";
    const sheet = await getMovieSheet(id, type);
    const mood = inferMood(sheet.genre_ids, sheet.keywords);
    // genre_ids y keywords solo sirven para calcular el mood: no los mandamos.
    const { genre_ids, keywords, ...publicData } = sheet;
    return NextResponse.json({ ...publicData, mood_label: MOOD_LABELS[mood] });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la ficha" }, { status: 502 });
  }
}
