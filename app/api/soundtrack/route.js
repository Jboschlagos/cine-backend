import { NextResponse } from "next/server";
import { findSoundtrack } from "@/lib/musicbrainz";

// GET /api/soundtrack?title=Interstellar&year=2014  (público)
// Devuelve la banda sonora encontrada en MusicBrainz, o null si no la encuentra.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();
  const year = searchParams.get("year");

  if (!title || title.length > 200) {
    return NextResponse.json({ error: "Parámetro 'title' requerido" }, { status: 400 });
  }

  try {
    return NextResponse.json(await findSoundtrack(title, year));
  } catch {
    return NextResponse.json(null); // si MusicBrainz falla, la ficha muestra solo el botón de Spotify
  }
}
