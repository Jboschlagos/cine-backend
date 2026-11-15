"use client";

import { Fragment, useRef, useState } from "react";
import Link from "next/link";
import ImageCarousel from "@/components/ImageCarousel";

// Link a la vista de una persona en Descubrir: /discover?persona=1234&rol=actor[&tipo=serie]
function personHref(personId, rol, mediaType) {
  const params = new URLSearchParams({ persona: String(personId), rol });
  if (mediaType === "tv") params.set("tipo", "serie");
  return `/discover?${params}`;
}

function formatRuntime(min) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

function formatLength(ms) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Botón + ventana emergente con la ficha técnica de una película.
// Lo que va entre <MovieSheet>...</MovieSheet> es lo que se ve como botón
// (en Descubrir es el afiche; en la reseña, el texto "Ficha técnica").
// showSoundtrack={false} oculta la banda sonora automática (en tus reseñas ya pones la tuya).
// mediaType="tv" para series.
// showTrailer={false} oculta el tráiler (en tus reseñas ya se ve en la página, bajo el carrusel).
export default function MovieSheet({ tmdbId, mediaType = "movie", showSoundtrack = true, showTrailer = true, className = "", children }) {
  const isTv = mediaType === "tv";
  const dialogRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState("");
  const [soundtrack, setSoundtrack] = useState(undefined); // undefined = cargando, null = no encontrada

  async function open() {
    dialogRef.current?.showModal(); // <dialog> nativo: se cierra con Esc y bloquea el fondo
    setIsOpen(true);
    if (sheet) return; // ya la cargamos antes

    setError("");
    const res = await fetch(`/api/movies/${tmdbId}/sheet${isTv ? "?type=tv" : ""}`);
    if (!res.ok) return setError("No se pudo cargar la ficha.");
    const data = await res.json();
    setSheet(data);

    if (showSoundtrack) {
      const params = new URLSearchParams({
        title: data.original_title || data.title,
        year: data.release_year ?? "",
      });
      const r = await fetch(`/api/soundtrack?${params}`);
      setSoundtrack(r.ok ? await r.json() : null);
    }
  }

  function close() {
    dialogRef.current?.close();
  }

  const spotifySearch = sheet
    ? `https://open.spotify.com/search/${encodeURIComponent(`${sheet.original_title || sheet.title} soundtrack`)}`
    : null;

  return (
    <>
      <button type="button" onClick={open} className={className}>
        {children}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        // clic en el fondo oscuro (fuera del contenido) = cerrar
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-xl bg-neutral-950 p-0 text-white backdrop:bg-black/70"
      >
        {/* Solo dibujamos el contenido con la ventana abierta: así el tráiler deja de sonar al cerrar */}
        {isOpen && (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-medium">
                {sheet ? sheet.title : "Cargando..."}{" "}
                {sheet?.release_year && <span className="text-neutral-300">({sheet.release_year})</span>}
              </h2>
              <button type="button" onClick={close} aria-label="Cerrar" className="text-2xl leading-none text-neutral-300 hover:text-white">
                ×
              </button>
            </div>

            {error && <p className="text-red-400">{error}</p>}

            {sheet && (
              <>

                {/* Arriba: afiches a la izquierda, información a la derecha (en celular, apilados) */}
                <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  {sheet.posters.length > 0 && (
                    // en celular el carrusel va más angosto para que no ocupe toda la pantalla
                    <div className="mx-auto w-full max-w-[240px] md:max-w-none">
                      <ImageCarousel images={sheet.posters} alt={sheet.title} />
                      {sheet.posters.length > 1 && (
                        <p className="mt-2 text-center text-xs text-neutral-400">
                          {sheet.posters.length} afiches · desliza para ver más
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-neutral-300">
                      {[
                        isTv && sheet.seasons && `${sheet.seasons} ${sheet.seasons === 1 ? "temporada" : "temporadas"}`,
                        sheet.runtime && (isTv ? `${formatRuntime(sheet.runtime)} por episodio` : formatRuntime(sheet.runtime)),
                        sheet.genre_names.join(", "),
                        sheet.vote_average && `★ ${sheet.vote_average} en TMDB`,
                        sheet.mood_label && `Mood: ${sheet.mood_label}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    <p className="leading-relaxed">{sheet.overview || "Sin sinopsis en español."}</p>

                    {/* Cada persona lleva a Descubrir: tus reseñas con ella + más de ella en TMDB */}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      {[
                        { label: isTv ? "Creada por" : "Dirección", list: sheet.directors, rol: "director" },
                        { label: "Música", list: sheet.composers, rol: "compositor" },
                        { label: "Reparto", list: sheet.cast, rol: "actor" },
                      ]
                        .filter(({ list }) => list.length > 0)
                        .map(({ label, list, rol }) => (
                          <Fragment key={rol}>
                            <dt className="text-neutral-300">{label}</dt>
                            <dd>
                              {list.map((person, i) => (
                                <Fragment key={person.id}>
                                  {i > 0 && ", "}
                                  <Link
                                    href={personHref(person.id, rol, mediaType)}
                                    onClick={close}
                                    className="border-b border-neutral-700 transition-colors hover:border-white"
                                  >
                                    {person.name}
                                  </Link>
                                </Fragment>
                              ))}
                            </dd>
                          </Fragment>
                        ))}
                    </dl>

                    <section>
                      <h3 className="mb-2 font-medium">Dónde {isTv ? "ver la serie" : "verla"} en Chile</h3>
                      {sheet.providers.streaming.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {sheet.providers.streaming.map((p) => (
                            <img key={p.name} src={p.logo} alt={p.name} title={p.name} className="h-10 w-10 rounded-lg" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400">No está en streaming en Chile por ahora.</p>
                      )}
                      {sheet.providers.link && (
                        <a href={sheet.providers.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-neutral-300 underline">
                          Ver todas las opciones (datos de JustWatch)
                        </a>
                      )}
                    </section>
                  </div>
                </div>

                {!showTrailer ? null : sheet.trailer_key ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${sheet.trailer_key}`}
                    title={`Tráiler de ${sheet.title}`}
                    className="aspect-video w-full rounded-lg"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  />
                ) : (
                  <p className="text-sm text-neutral-400">No encontramos tráiler para esta {isTv ? "serie" : "película"}.</p>
                )}

                {showSoundtrack && (
                  <section>
                    <h3 className="mb-2 font-medium">Banda sonora</h3>
                    {soundtrack === undefined && <p className="text-sm text-neutral-400">Buscando banda sonora...</p>}
                    {soundtrack && (
                      <>
                        <p className="mb-2 text-sm text-neutral-300">
                          {soundtrack.album}
                          {soundtrack.artist && ` — ${soundtrack.artist}`}
                        </p>
                        <ol className="mb-2 max-h-60 overflow-y-auto text-sm">
                          {soundtrack.tracks.map((t, i) => (
                            <li key={i} className="flex justify-between gap-4 border-b border-neutral-900 py-1">
                              <span>
                                {i + 1}. {t.title}
                                {t.artist && t.artist !== soundtrack.artist && (
                                  <span className="text-neutral-400"> — {t.artist}</span>
                                )}
                              </span>
                              <span className="text-neutral-400">{formatLength(t.length)}</span>
                            </li>
                          ))}
                        </ol>
                        <a href={soundtrack.url} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-400 underline">
                          Fuente: MusicBrainz
                        </a>
                      </>
                    )}
                    {soundtrack === null && (
                      <p className="text-sm text-neutral-400">No encontramos el listado de canciones.</p>
                    )}
                    <a
                      href={spotifySearch}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block w-fit rounded-full bg-[#1DB954] px-4 py-2 text-sm font-medium text-black"
                    >
                      Escuchar en Spotify
                    </a>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
