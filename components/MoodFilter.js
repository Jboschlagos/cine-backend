"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FILTERS } from "@/lib/filters";

// Filtros como una frase: "Hoy quiero algo [para llorar ▾] [chileno ▾] [de los 80 ▾] ..."
// Cada parte subrayada abre su propio panel. Las partes sin elegir se ven en gris.
// segments = qué filtros mostrar (en Reseñas no va "dónde verla").
// extra = parámetros que no son filtros pero se conservan (búsqueda ?q y orden).
export default function MoodFilter({
  basePath = "/",
  prefix = "Hoy quiero algo",
  active = {},
  segments = ["mood", "origin", "era", "length"],
  extra = {},
  labels = {},
}) {
  // Texto de una opción; "labels" permite cambiarlo en una página, ej. { mood: { musical: "con banda sonora" } }
  const label = (name, key) => labels[name]?.[key] ?? FILTERS[name].options[key];
  const boxRef = useRef(null);
  const pathname = usePathname();

  // Cerrar al navegar o al cambiar un filtro: guardamos en qué "vista" (ruta + filtros)
  // se abrió el panel; si la vista cambia deja de coincidir y queda cerrado, sin useEffect.
  const viewKey = pathname + JSON.stringify(active);
  const [openState, setOpenState] = useState(null); // { name, at: viewKey }
  const openName = openState?.at === viewKey ? openState.name : null;
  const setOpenName = (name) => setOpenState(name ? { name, at: viewKey } : null);
  const closePanel = () => setOpenName(null);

  // Cerrar al hacer clic afuera o con Esc.
  useEffect(() => {
    if (!openName) return;
    const onClick = (e) => !boxRef.current?.contains(e.target) && setOpenState(null);
    const onKey = (e) => e.key === "Escape" && setOpenState(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openName]);

  // Link que cambia UN filtro y mantiene los demás.
  const hrefWith = (name, value) => {
    const next = { ...active, ...extra };
    if (value) next[name] = value;
    else delete next[name];
    const query = new URLSearchParams(next).toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const optionClass = (isActive) =>
    `block py-0.5 transition-colors ${isActive ? "text-white" : "text-neutral-500 hover:text-white"}`;

  const open = openName ? FILTERS[openName] : null;
  const anyActive = segments.some((name) => active[name]);
  const extraQuery = new URLSearchParams(extra).toString();
  const hrefClear = extraQuery ? `${basePath}?${extraQuery}` : basePath;

  return (
    <div ref={boxRef} className="relative mx-auto max-w-3xl px-4 pb-6 pt-5 text-center">
      <p className="font-display text-sm uppercase leading-loose tracking-[0.2em] text-neutral-500 sm:text-base">
        {prefix}{" "}
        {segments.map((name) => {
          const value = active[name];
          return (
            <span key={name}>
              <button
                type="button"
                onClick={() => setOpenName(openName === name ? null : name)}
                aria-expanded={openName === name}
                aria-controls="filter-panel"
                className={`border-b pb-0.5 uppercase tracking-[0.2em] transition-colors ${
                  value ? "border-white text-white" : "border-neutral-700 text-neutral-600 hover:text-neutral-300"
                }`}
              >
                {value ? label(name, value) : FILTERS[name].all}{" "}
                <span className="text-xs">{openName === name ? "▴" : "▾"}</span>
              </button>{" "}
            </span>
          );
        })}
      </p>

      {anyActive && (
        <Link href={hrefClear} className="mt-1 inline-block font-display text-[10px] uppercase tracking-[0.25em] text-neutral-600 hover:text-white">
          Limpiar filtros
        </Link>
      )}

      {open && (
        <div
          id="filter-panel"
          className="absolute left-1/2 top-full z-20 -mt-3 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-lg border border-neutral-800 bg-black/95 px-4 py-3 text-left shadow-2xl backdrop-blur"
        >
          <div className={`grid gap-x-6 gap-y-3 font-display text-[11px] uppercase tracking-[0.15em] ${open.groups ? "grid-cols-2 sm:grid-cols-3" : ""}`}>
            {(open.groups ?? [{ title: null, keys: Object.keys(open.options) }]).map((group, i) => (
              <div key={group.title ?? i} className={open.groups ? "" : "columns-2 gap-x-6"}>
                {group.title && (
                  <h3 className="mb-1 text-[9px] tracking-[0.3em] text-neutral-700">{group.title}</h3>
                )}
                {group.keys.map((key) => (
                  <Link key={key} href={hrefWith(openName, key)} onClick={closePanel} className={optionClass(active[openName] === key)}>
                    {label(openName, key)}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <Link
            href={hrefWith(openName, null)}
            onClick={closePanel}
            className={`mt-3 border-t border-neutral-900 pt-2 text-center font-display text-[11px] uppercase tracking-[0.15em] ${optionClass(!active[openName])}`}
          >
            {open.all}
          </Link>
        </div>
      )}
    </div>
  );
}
