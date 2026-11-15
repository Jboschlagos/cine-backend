"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FILTERS, FILTER_TITLES, REVIEW_SORTS, filterHref } from "@/lib/filters";

// Celular y tablet (menos de 1024px): botón "FILTROS · 2" que abre un panel desde abajo
// con los filtros de "Hoy quiero algo…" y "Ordenar", uno por línea.
// Tocar una opción solo la MARCA (borrador); "Ver resultados" aplica todo de una vez.
// "Limpiar" desmarca todo en el panel (sin cerrarlo).
// Usa los mismos datos (FILTERS, REVIEW_SORTS) y el mismo armado de links (filterHref)
// que la frase de escritorio, así la lógica no se duplica.
//
// Props:
//   basePath  "/" (portada)
//   segments  qué filtros mostrar, ej. ["mood", "origin", "era", "length"]
//   active    filtros activos de la URL, ej. { mood: "tension" }
//   sort      orden activo ("recientes", "anio", "titulo")
//   keep      lo que se conserva al aplicar: búsqueda, tipo y filtros por persona
//   extraCount cuántos filtros por persona hay (también cuentan en "Filtros · N")
//   labels    textos distintos para alguna opción, ej. { mood: { musical: "con banda sonora" } }
export default function FilterSheet({ basePath, segments, active, sort, keep = {}, extraCount = 0, labels = {} }) {
  const router = useRouter();
  const dialogRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState({ filters: active, sort });

  const count = Object.keys(active).length + extraCount;
  const label = (name, key) => labels[name]?.[key] ?? FILTERS[name].options[key];

  // Con el panel abierto, la página de atrás no se desplaza.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  function open() {
    setDraft({ filters: active, sort }); // parte desde lo que está aplicado
    dialogRef.current?.showModal(); // <dialog> nativo: se cierra con Esc
    setIsOpen(true);
  }
  const close = () => dialogRef.current?.close();

  // Tocar una opción la marca; tocar la ya marcada la desmarca.
  const toggle = (name, key) =>
    setDraft((d) => ({ ...d, filters: { ...d.filters, [name]: d.filters[name] === key ? null : key } }));

  function apply() {
    const orden = draft.sort !== "recientes" ? draft.sort : null;
    router.push(filterHref(basePath, { ...draft.filters, ...keep, orden }));
    close();
  }

  const chip = (isActive) =>
    `min-h-10 border px-3 py-2 font-display text-xs uppercase tracking-[0.15em] transition-colors ${
      isActive ? "border-white text-white" : "border-neutral-800 text-neutral-400 hover:text-neutral-200"
    }`;
  const titleClass = "mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-neutral-500";

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="border-b border-neutral-700 pb-1 font-display text-xs uppercase tracking-[0.2em] text-neutral-300 transition-colors hover:border-white hover:text-white"
      >
        Filtros{count > 0 && <span className="text-white"> · {count}</span>} ▾
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        // tocar el fondo oscuro (fuera del panel) = cerrar
        onClick={(e) => e.target === dialogRef.current && close()}
        aria-label="Filtros"
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85svh] w-full max-w-none overflow-hidden rounded-t-2xl border-t border-neutral-800 bg-black p-0 text-white backdrop:bg-black/70"
      >
        <div className="flex max-h-[85svh] flex-col">
          {/* Encabezado */}
          <div className="flex items-center justify-between border-b border-neutral-900 px-5 py-4">
            <h2 className="font-display text-sm uppercase tracking-[0.25em]">Filtros</h2>
            <button type="button" onClick={close} aria-label="Cerrar filtros" className="text-2xl leading-none text-neutral-400 hover:text-white">
              ×
            </button>
          </div>

          {/* Opciones (se desplaza si no caben) */}
          <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
            {segments.map((name) => {
              const filter = FILTERS[name];
              // El mood va con sus grupos (Sentir · Pulso · Disfrutar), como en escritorio
              const groups = filter.groups ?? [{ title: null, keys: Object.keys(filter.options) }];
              return (
                <section key={name}>
                  <h3 className={titleClass}>{FILTER_TITLES[name]}</h3>
                  <div className="flex flex-col gap-3">
                    {groups.map((group, i) => (
                      <div key={group.title ?? i}>
                        {group.title && <p className="mb-1.5 font-display text-[9px] uppercase tracking-[0.3em] text-neutral-600">{group.title}</p>}
                        <div className="flex flex-wrap gap-2">
                          {group.keys.map((key) => (
                            <button
                              key={key}
                              type="button"
                              aria-pressed={draft.filters[name] === key}
                              onClick={() => toggle(name, key)}
                              className={chip(draft.filters[name] === key)}
                            >
                              {label(name, key)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            <section>
              <h3 className={titleClass}>Ordenar</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(REVIEW_SORTS).map(([key, text]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={draft.sort === key}
                    onClick={() => setDraft((d) => ({ ...d, sort: key }))}
                    className={chip(draft.sort === key)}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Botones fijos abajo */}
          <div className="flex gap-3 border-t border-neutral-900 px-5 py-4">
            <button
              type="button"
              onClick={() => setDraft({ filters: {}, sort: "recientes" })}
              className="min-h-11 flex-1 border border-neutral-700 font-display text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={apply}
              className="min-h-11 flex-[2] bg-white font-display text-xs uppercase tracking-[0.2em] text-black hover:bg-neutral-200"
            >
              Ver resultados
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
