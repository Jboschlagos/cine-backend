"use client";

import { useEffect, useState } from "react";
import { SOUNDTRACKS } from "@/lib/soundtracks";

function randomIndex(except) {
  if (SOUNDTRACKS.length < 2) return 0;
  let i;
  do i = Math.floor(Math.random() * SOUNDTRACKS.length);
  while (i === except);
  return i;
}

// Se recuerda en el navegador del visitante si dejó el reproductor abierto.
// try/catch: en modo privado o con el almacenamiento bloqueado, simplemente parte minimizado.
const STORAGE_KEY = "soundtrack-open";
function readOpen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
function saveOpen(open) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    // sin almacenamiento: no pasa nada, solo no se recuerda
  }
}

// Tema oscuro del embed de Spotify (theme=0); sin esto usa el color de la portada.
function darkEmbed(src) {
  const url = new URL(src);
  url.searchParams.set("theme", "0");
  return url.toString();
}

// Banda sonora al azar, fija abajo a la derecha.
// Minimizado: solo un botón "♪ Banda sonora · Película".
// Desplegado: la barra con el embed de Spotify.
//   ▾ minimiza SIN quitar el iframe (la música sigue sonando).
//   × detiene la música (quita el iframe) y vuelve al botón.
// El iframe se crea recién la primera vez que se despliega.
// Los navegadores no dejan que el audio parta solo: el visitante aprieta play.
export default function SoundtrackPlayer() {
  const [index, setIndex] = useState(null);
  const [open, setOpen] = useState(false); // ¿se ve la barra?
  const [loaded, setLoaded] = useState(false); // ¿ya existe el iframe?

  // El azar y lo guardado se leen en el navegador (no en el servidor) para que
  // el HTML del servidor y el del navegador coincidan.
  // setState en el efecto es intencional: estos valores solo existen después de la
  // hidratación, así que el primer render va vacío y este efecto lo llena una vez.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const wasOpen = readOpen();
    setIndex(randomIndex());
    setOpen(wasOpen);
    setLoaded(wasOpen);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (index === null) return null;
  const track = SOUNDTRACKS[index];

  const expand = () => {
    setOpen(true);
    setLoaded(true);
    saveOpen(true);
  };
  const minimize = () => {
    setOpen(false);
    saveOpen(false);
  };
  const stop = () => {
    setOpen(false);
    setLoaded(false);
    saveOpen(false);
  };

  const smallText = "font-display text-[11px] uppercase tracking-[0.15em]";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={expand}
          aria-expanded={false}
          aria-controls="soundtrack-player"
          className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)] truncate border border-neutral-800 bg-black/90 px-4 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-neutral-300 backdrop-blur transition-colors hover:border-neutral-600 hover:text-white"
        >
          ♪ Banda sonora · <span className="text-white">{track.movie}</span>
        </button>
      )}

      {/* Con la barra desplegada (~97px) agregamos espacio al final de la página para que
          no tape el footer. Este componente va después del footer en el layout, así que
          este bloque lo empuja: pb-16 del footer (64px) + h-10 (40px) > 97px. */}
      {open && <div aria-hidden="true" className="h-10" />}

      {/* Una vez creado, el iframe se mantiene (solo se oculta) para que la música no se corte */}
      {loaded && (
        <div
          id="soundtrack-player"
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-neutral-900 bg-black/90 backdrop-blur ${open ? "" : "hidden"}`}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
            {/* El nombre y el compositor ya los muestra el embed */}
            <span className={`hidden shrink-0 text-neutral-400 sm:block ${smallText}`}>Sonando al azar</span>
            <iframe
              key={track.embed}
              src={darkEmbed(track.embed)}
              title={`Banda sonora de ${track.movie}`}
              height="80"
              className="h-20 min-w-0 flex-1 rounded-lg"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => setIndex(randomIndex(index))}
              className={`shrink-0 text-neutral-400 hover:text-white ${smallText}`}
            >
              Otra
            </button>
            <button
              type="button"
              onClick={minimize}
              aria-label="Minimizar reproductor"
              aria-expanded={true}
              className="shrink-0 text-base leading-none text-neutral-400 hover:text-white"
            >
              ▾
            </button>
            <button
              type="button"
              onClick={stop}
              aria-label="Detener y cerrar reproductor"
              className="shrink-0 text-xl leading-none text-neutral-400 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
