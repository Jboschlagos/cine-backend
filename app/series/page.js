import { redirect } from "next/navigation";

// Series ahora vive en Reseñas: /?tipo=serie (con el selector Películas | Series).
// Esta página solo redirige, para que los links viejos a /series sigan funcionando.
// Conserva filtros, búsqueda y orden: /series?mood=tension -> /?mood=tension&tipo=serie
// redirect() es temporal (307): si algún día /series vuelve a ser una página, no queda
// "pegado" en los navegadores como pasaría con una redirección permanente.
export default async function SeriesPage({ searchParams }) {
  const params = await searchParams;
  const next = new URLSearchParams();
  for (const [name, value] of Object.entries(params ?? {})) {
    for (const v of [].concat(value)) next.append(name, v);
  }
  next.set("tipo", "serie");
  redirect(`/?${next}`);
}
