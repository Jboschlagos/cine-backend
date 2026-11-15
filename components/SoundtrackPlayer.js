"use client";

import { useEffect, useRef, useState } from "react";
import { SOUNDTRACKS } from "@/lib/soundtracks";
import { PAUSE_MUSIC_EVENT } from "@/lib/music";

// ---- Spotify iFrame API ----
// Script oficial de Spotify que crea el reproductor y entrega un "control"
// con pause(), loadUri(), etc. (un <iframe> simple no se puede pausar desde el código).
// Se carga una sola vez, recién cuando se abre el reproductor.
let spotifyApiPromise = null;
function loadSpotifyApi() {
  if (!spotifyApiPromise) {
    spotifyApiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = resolve; // Spotify llama a esta función al terminar de cargar
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);
    });
  }
  return spotifyApiPromise;
}

// "https://open.spotify.com/embed/album/ID" -> "spotify:album:ID" (el formato que pide la API)
function toSpotifyUri(embedUrl) {
  const [, , type, id] = new URL(embedUrl).pathname.split("/");
  return `spotify:${type}:${id}`;
}

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

// Banda sonora al azar, fija abajo a la derecha.
// Minimizado: solo un botón "♪ Banda sonora · Película".
// Desplegado: la barra con el embed de Spotify.
//   ▾ minimiza SIN quitar el iframe (la música sigue sonando).
//   × detiene la música (quita el iframe) y vuelve al botón.
// El iframe se crea recién la primera vez que se despliega.
// Los navegadores no dejan que el audio parta solo: el visitante aprieta play.
// Si otra parte del sitio llama a pauseMusic() (lib/music.js), la música se pausa.
export default function SoundtrackPlayer() {
  const [index, setIndex] = useState(null);
  const [open, setOpen] = useState(false); // ¿se ve la barra?
  const [loaded, setLoaded] = useState(false); // ¿ya existe el iframe?
  const hostRef = useRef(null); // contenedor donde Spotify pone su iframe
  const controllerRef = useRef(null); // el "control" de Spotify (pause, loadUri...)

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

  // Crear el reproductor de Spotify al desplegar por primera vez; destruirlo con ×.
  // La API REEMPLAZA el elemento que le damos por su iframe: por eso le pasamos un
  // <div> creado a mano (no uno de React), dentro del contenedor hostRef.
  useEffect(() => {
    if (!loaded || index === null) return;
    const host = hostRef.current;
    const target = document.createElement("div");
    host.appendChild(target);
    let cancelled = false;

    loadSpotifyApi().then((api) => {
      if (cancelled) return;
      const track = SOUNDTRACKS[index];
      api.createController(
        target,
        { uri: toSpotifyUri(track.embed), width: "100%", height: 80, theme: "dark" },
        (controller) => {
          if (cancelled) return controller.destroy();
          controller.iframeElement.title = `Banda sonora de ${track.movie}`;
          controllerRef.current = controller;
        },
      );
    });

    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      host.replaceChildren();
    };
    // Solo depende de "loaded": al cambiar de banda sonora ("Otra") no se recrea,
    // se carga la nueva en el mismo reproductor (efecto de abajo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // "Otra": carga la nueva banda sonora en el reproductor que ya existe.
  useEffect(() => {
    if (index === null) return;
    controllerRef.current?.loadUri(toSpotifyUri(SOUNDTRACKS[index].embed));
  }, [index]);

  // Pausar cuando otra parte del sitio lo pide (ej. al dar play al tráiler).
  useEffect(() => {
    const onPause = () => controllerRef.current?.pause();
    window.addEventListener(PAUSE_MUSIC_EVENT, onPause);
    return () => window.removeEventListener(PAUSE_MUSIC_EVENT, onPause);
  }, []);

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
            {/* Aquí Spotify pone su iframe (ver el efecto que crea el reproductor) */}
            <div ref={hostRef} className="h-20 min-w-0 flex-1 overflow-hidden rounded-lg" />
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
