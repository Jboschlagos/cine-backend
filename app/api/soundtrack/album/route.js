import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { toSpotifyUri } from "@/lib/spotify";
import { saveSoundtrackUri } from "@/lib/soundtrackSpotify";

// PUT /api/soundtrack/album  (solo admin) -> corregir a mano el álbum de la ficha técnica
// body: { tmdb_id, type: "movie"|"tv", link }
//   link = link de un álbum o playlist de Spotify -> se guarda ese
//   link = "" o null                              -> "No tiene" (no se vuelve a buscar solo)
export async function PUT(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const tmdbId = Number(body.tmdb_id);
  const type = body.type === "tv" ? "tv" : "movie";
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "tmdb_id inválido" }, { status: 400 });
  }

  const link = typeof body.link === "string" ? body.link.trim() : "";
  const uri = link ? toSpotifyUri(link) : null;
  if (link && !uri) {
    return NextResponse.json(
      { error: "Debe ser un link de un álbum o playlist de Spotify" },
      { status: 400 },
    );
  }

  try {
    await saveSoundtrackUri(tmdbId, type, uri, "manual");
  } catch {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ spotifyUri: uri });
}
