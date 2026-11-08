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

// Barra fija abajo con una banda sonora al azar.
// Los navegadores no dejan que el audio parta solo: el visitante aprieta play.
export default function SoundtrackPlayer() {
  const [index, setIndex] = useState(null);
  const [closed, setClosed] = useState(false);

  // El azar se elige en el navegador (no en el servidor) para que
  // el HTML del servidor y el del navegador coincidan.
  // setState en el efecto es intencional: el valor solo puede existir después de la
  // hidratación, así que el primer render va vacío y este efecto lo llena una vez.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIndex(randomIndex()), []);

  if (closed || index === null) return null;
  const track = SOUNDTRACKS[index];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-900 bg-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
        <div className="hidden w-48 shrink-0 font-display text-[11px] uppercase tracking-[0.15em] text-neutral-500 sm:block">
          Sonando al azar
          <span className="block truncate text-white">{track.movie}</span>
          <span className="block truncate normal-case tracking-normal">{track.by}</span>
        </div>
        <iframe
          key={track.embed}
          src={track.embed}
          title={`Banda sonora de ${track.movie}`}
          height="80"
          className="h-20 min-w-0 flex-1 rounded-lg"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => setIndex(randomIndex(index))}
          className="shrink-0 font-display text-[11px] uppercase tracking-[0.15em] text-neutral-500 hover:text-white"
        >
          Otra
        </button>
        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Cerrar reproductor"
          className="shrink-0 text-xl leading-none text-neutral-500 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
