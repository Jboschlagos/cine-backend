import { NextResponse } from "next/server";
import { getReviews } from "@/lib/reviews";
import {
  readFilters,
  readSearch,
  readSort,
  toReviewFilters,
  REVIEW_SEGMENTS,
  SERIES_SEGMENTS,
} from "@/lib/filters";

// GET /api/feed?mood=tension&q=alien&orden=anio&page=2[&tipo=serie]  (público)
// Lo usa el botón "Ver más" de Reseñas y de Series.
export async function GET(request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const page = Number(params.page);
  if (!Number.isInteger(page) || page < 1 || page > 1000) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const mediaType = params.tipo === "serie" ? "tv" : "movie";
  const active = readFilters(params, mediaType === "tv" ? SERIES_SEGMENTS : REVIEW_SEGMENTS);
  try {
    const data = await getReviews(toReviewFilters(active), {
      q: readSearch(params),
      sort: readSort(params),
      page,
      mediaType,
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las reseñas" }, { status: 500 });
  }
}
