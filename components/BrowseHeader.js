import Link from "next/link";
import SearchBox from "@/components/SearchBox";

// Cabecera compartida de Reseñas ("/") y Descubrir ("/discover").
// En celular: todo apilado y centrado.
// Desde lg, 2 columnas (bordes alineados a la grilla, max-w-6xl):
//   Películas │ buscador
//   Series    │ children (la frase de filtros, o "Resultados para…")
//
// Props:
//   type       "movie" o "tv" (cuál pestaña está marcada)
//   typeHref   (type) => link para cambiar de tipo (cada página decide qué conserva)
//   search     props para <SearchBox>: { action, q, keep, placeholder }
//   phraseRow  true si children es la frase de filtros (alinea "Series" con su texto)
//   children   lo que va bajo el buscador; usa RIGHT_COLUMN_CLASS para ubicarse
const TYPE_TABS = [
  { type: "movie", label: "Películas" },
  { type: "tv", label: "Series" },
];

// Clases para lo que va en la columna derecha, bajo el buscador.
export const RIGHT_COLUMN_CLASS = "lg:col-start-2 lg:mx-0 lg:max-w-none lg:px-0 lg:pt-1 lg:text-left";

export default function BrowseHeader({ type, typeHref, search, phraseRow = true, children }) {
  return (
    <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[auto_1fr] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-10 lg:px-4 lg:pt-8">
      {/* Ocupa las 2 filas; con subgrid cada link queda en la fila de al lado */}
      <nav
        aria-label="Películas o series"
        className="mx-auto flex max-w-sm justify-center gap-6 px-4 pt-8 font-display text-xs uppercase tracking-[0.25em] lg:row-span-2 lg:mx-0 lg:grid lg:grid-rows-subgrid lg:gap-0 lg:px-0 lg:pt-0"
      >
        {TYPE_TABS.map((tab) => (
          <Link
            key={tab.type}
            href={typeHref(tab.type)}
            aria-current={type === tab.type ? "page" : undefined}
            // "Series" baja un poco para quedar a la altura del texto de la frase (que tiene leading-loose)
            className={`border-b pb-1 transition-colors lg:justify-self-start ${
              tab.type === "tv" && phraseRow ? "lg:mt-3 xl:mt-2.5" : ""
            } ${
              type === tab.type
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <SearchBox {...search} className="lg:col-start-2 lg:mx-0 lg:px-0 lg:pt-0" />

      {children}
    </div>
  );
}
