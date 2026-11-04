import { NextResponse } from "next/server";
import { discoverMovies, searchMoviesPage, SORT_OPTIONS } from "@/lib/tmdb";
import { readFilters, readSearch, toDiscoverFilters } from "@/lib/filters";

// GET /api/discover?mood=tension&era=80s&sort=popularity.desc&page=3  (público)
// Lo usa el botón "Ver más" de Descubrir.
// GET /api/discover?q=alien&page=2  -> búsqueda por título (ignora filtros)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort");
  const page = Number(searchParams.get("page"));
  const q = readSearch(Object.fromEntries(searchParams));
  const validPage = Number.isInteger(page) && page >= 1 && page <= 500;

  if (q) {
    if (!validPage) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    try {
      return NextResponse.json(await searchMoviesPage(q, page));
    } catch {
      return NextResponse.json({ error: "No se pudo consultar TMDB" }, { status: 502 });
    }
  }

  if (!SORT_OPTIONS.includes(sort) || !validPage) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const active = readFilters(Object.fromEntries(searchParams));
  try {
    const data = await discoverMovies(toDiscoverFilters(active), { sortBy: sort, page });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo consultar TMDB" }, { status: 502 });
  }
}
