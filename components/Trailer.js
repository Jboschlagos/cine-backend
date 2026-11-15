"use client";

import { useEffect, useRef, useState } from "react";
import { pauseMusic } from "@/lib/music";

// ---- YouTube IFrame API ----
// Script oficial de YouTube: crea el reproductor y avisa cuando el video
// empieza (para pausar la música) y cuando termina (para volver a la miniatura).
// Se carga una sola vez, recién cuando alguien aprieta ▶.
let youTubeApiPromise = null;
function loadYouTubeApi() {
  if (!youTubeApiPromise) {
    youTubeApiPromise = new Promise((resolve) => {
      if (window.YT?.Player) return resolve(window.YT);
      window.onYouTubeIframeAPIReady = () => resolve(window.YT); // YouTube la llama al terminar de cargar
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    });
  }
  return youTubeApiPromise;
}

// Tráiler de una reseña, dentro del sitio:
// 1) Se ve la miniatura con un ▶ (no se carga nada de YouTube todavía).
// 2) Al apretar ▶: se pausa la banda sonora de abajo y se carga el video con
//    youtube-nocookie (sin cookies de seguimiento), autoplay y rel=0
//    (YouTube no permite quitar del todo los videos sugeridos: rel=0 deja solo los del mismo canal).
// 3) Al terminar, vuelve la miniatura, así no aparece la pantalla final de YouTube.
export default function Trailer({ videoKey, title, className = "" }) {
  const [playing, setPlaying] = useState(false);
  const hostRef = useRef(null); // contenedor donde YouTube pone su iframe

  useEffect(() => {
    if (!playing) return;
    // Igual que con Spotify: la API REEMPLAZA el elemento que le damos,
    // así que le pasamos un <div> creado a mano (no uno de React).
    const host = hostRef.current;
    const target = document.createElement("div");
    host.appendChild(target);
    let player = null;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(target, {
        host: "https://www.youtube-nocookie.com",
        videoId: videoKey,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) pauseMusic(); // también si lo reanudan después
            if (e.data === YT.PlayerState.ENDED) setPlaying(false); // vuelve la miniatura
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
      host.replaceChildren();
    };
  }, [playing, videoKey]);

  function start() {
    pauseMusic();
    setPlaying(true);
  }

  return (
    <section className={className}>
      <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-neutral-400">Tráiler</h2>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-950">
        {playing ? (
          <div ref={hostRef} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
        ) : (
          <button
            type="button"
            onClick={start}
            aria-label={`Ver el tráiler de ${title}`}
            className="group block h-full w-full"
          >
            {/* Miniatura de YouTube (hqdefault siempre existe; trae franjas negras que object-cover recorta) */}
            <img
              src={`https://i.ytimg.com/vi/${videoKey}/hqdefault.jpg`}
              alt=""
              className="h-full w-full object-cover brightness-75 transition duration-500 group-hover:brightness-100"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-black/50 pl-1 text-2xl text-white transition group-hover:scale-110 group-hover:bg-black/70">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
