import ReviewsIndex from "@/components/ReviewsIndex";
import { readMediaType } from "@/lib/filters";

// Título de la pestaña: con ?tipo=serie dice "Series · Reducido"
// (como la antigua página /series); si no, queda el título del sitio.
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  return readMediaType(params) === "tv" ? { title: "Series" } : {};
}

// Reseñas (películas y series): el tipo, filtros, búsqueda y orden vienen en la URL.
export default function HomePage({ searchParams }) {
  return <ReviewsIndex searchParams={searchParams} />;
}
