"use client";

import { useEffect, useRef } from "react";
import { loadSpotifyApi } from "@/lib/spotify";
import { pauseMusic } from "@/lib/music";

// Álbum o playlist de Spotify embebido (tema oscuro), creado con la iFrame API
// para saber cuándo empieza a sonar: en ese momento pausa la banda sonora fija de abajo.
// uri = "spotify:album:ID" o "spotify:playlist:ID".
// height 352 = el tamaño de Spotify que muestra la lista de canciones (se puede elegir cuál tocar).
export default function SpotifyEmbed({ uri, title, height = 352, className = "" }) {
  const hostRef = useRef(null);

  useEffect(() => {
    // La API REEMPLAZA el elemento que le damos: le pasamos un <div> creado a mano.
    const host = hostRef.current;
    const target = document.createElement("div");
    host.appendChild(target);
    let controller = null;
    let cancelled = false;

    loadSpotifyApi().then((api) => {
      if (cancelled) return;
      api.createController(target, { uri, width: "100%", height, theme: "dark" }, (c) => {
        if (cancelled) return c.destroy();
        controller = c;
        c.iframeElement.title = title;
        // Al pasar de pausado a sonando -> pausar la banda sonora fija
        let wasPaused = true;
        c.addListener("playback_update", (e) => {
          const isPaused = e.data?.isPaused ?? true;
          if (wasPaused && !isPaused) pauseMusic();
          wasPaused = isPaused;
        });
      });
    });

    return () => {
      cancelled = true;
      controller?.destroy();
      host.replaceChildren();
    };
  }, [uri, title, height]);

  return <div ref={hostRef} style={{ height }} className={`w-full overflow-hidden rounded-xl ${className}`} />;
}
