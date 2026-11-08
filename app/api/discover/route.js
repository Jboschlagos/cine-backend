import { NextResponse } from "next/server";
import { discoverMovies, searchMoviesPage, SORT_OPTIONS } from "@/lib/tmdb";
import { readFilters, readMediaType, readSearch, toDiscoverFilters, DISCOVER_SEGMENTS } from "@/lib/filters";

// GET /api/discover?mood=tension&era=80s&sort=popularity.desc&page=3  (público)
// Lo usa el botón "Ver más" de Descubrir.
// GET /api/discover?q=alien&page=2  -> búsqueda por título (ignora filtros)
// &tipo=serie en cualquiera de las dos -> series en vez de películas
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams);
  const type = readMediaType(params);
  const sort = searchParams.get("sort");
  const page = Number(searchParams.get("page"));
  const q = readSearch(params);
  const validPage = Number.isInteger(page) && page >= 1 && page <= 500;

  if (q) {
    if (!validPage) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    try {
      return NextResponse.json(await searchMoviesPage(q, page, type));
    } catch {
      return NextResponse.json({ error: "No se pudo consultar TMDB" }, { status: 502 });
    }
  }

  if (!SORT_OPTIONS[type].includes(sort) || !validPage) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  // Solo los filtros que aplican a este tipo (en series no va "duración").
  const active = readFilters(params, DISCOVER_SEGMENTS[type]);
  try {
    const data = await discoverMovies(toDiscoverFilters(active, type), { sortBy: sort, page, type });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo consultar TMDB" }, { status: 502 });
  }
}
