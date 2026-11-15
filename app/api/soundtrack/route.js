import { NextResponse } from "next/server";
import { findSoundtrack } from "@/lib/musicbrainz";
import { getTitleInfo } from "@/lib/tmdb";
import { findSoundtrackUri } from "@/lib/soundtrackSpotify";

// GET /api/soundtrack?tmdb_id=157336[&type=tv]  (público)
// Devuelve { list, spotifyUri }:
//   list       = canciones de MusicBrainz ({ album, artist, url, tracks }) o null
//   spotifyUri = "spotify:album:ID" para escuchar en la ficha, o null
// El título se saca de TMDB aquí en el servidor (no se acepta desde el navegador),
// así nadie puede guardar un álbum equivocado mandando un título falso.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get("tmdb_id");
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";
  if (!/^\d{1,9}$/.test(tmdbId ?? "")) {
    return NextResponse.json({ error: "Parámetro 'tmdb_id' inválido" }, { status: 400 });
  }

  const info = await getTitleInfo(tmdbId, type).catch(() => null);
  if (!info) return NextResponse.json({ list: null, spotifyUri: null });

  // Si MusicBrainz falla, seguimos sin lista (la ficha muestra el botón de Spotify)
  // y avisamos con mbFailed para que NO se guarde "no tiene" por una falla momentánea.
  let mbFailed = false;
  const found = await findSoundtrack(info.original_title || info.title, info.release_year).catch(() => {
    mbFailed = true;
    return null;
  });
  const { spotify_link, ...list } = found ?? {};

  // Si la base falla (ej. falta correr la migración), seguimos sin álbum.
  const spotifyUri = await findSoundtrackUri(Number(tmdbId), type, found, { mbFailed }).catch(() => null);

  return NextResponse.json({ list: found ? list : null, spotifyUri });
}
