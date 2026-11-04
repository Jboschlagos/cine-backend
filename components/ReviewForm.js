"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MOOD_LABELS } from "@/lib/mood";

const MAX_IMAGES = 10;
const IG_PREFIX = "ig:"; // las fotos de IG se marcan "ig:media/posts/123.webp" hasta subirlas
const igPreview = (path) => `/api/ig/image?path=${encodeURIComponent(path)}`;

// Formulario del admin para publicar una reseña, en 3 pasos:
// 1) buscar la película o serie en TMDB, 2) elegir/subir imágenes, 3) reseña + soundtrack.
//
// prefill (opcional, desde "Importar de IG"):
//   { igPostId, title, altTitle, year, isSeries, text, images: ["media/posts/123.webp", ...] }
// Con prefill: se busca sola en TMDB, las fotos de IG aparecen primero (marcadas las
// primeras 10) y al publicar se suben a Cloudinary SOLO las fotos marcadas.
//
// existing (opcional, desde "Editar"): la reseña ya publicada
//   { id, tmdb_id, media_type, title, release_year, review_text, soundtrack, mood, created_at, images }
// Con existing: todo viene cargado, se puede cambiar mood y fecha, y "Guardar" actualiza la reseña.

// "2026-10-20T23:16:52Z" -> "2026-10-20" (en tu hora local), para el campo de fecha
function toDateInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ReviewForm({ prefill = null, existing = null }) {
  const router = useRouter();
  const igOptions = (prefill?.images ?? []).map((path) => ({
    url: IG_PREFIX + path,
    preview: igPreview(path),
    language: "instagram",
  }));
  const igDefault = igOptions.slice(0, MAX_IMAGES).map((p) => p.url);
  // Fotos que ya tiene la reseña (al editar): siempre quedan como opción
  const baseOptions = [...igOptions, ...(existing?.images ?? []).map((url) => ({ url, language: "actual" }))];
  const baseUrls = new Set(baseOptions.map((p) => p.url));
  const startImages = existing?.images ?? igDefault;

  const [mediaType, setMediaType] = useState(existing?.media_type ?? (prefill?.isSeries ? "tv" : "movie"));
  const [query, setQuery] = useState(prefill?.title ?? existing?.title ?? "");
  const [results, setResults] = useState([]);
  const [movie, setMovie] = useState(
    existing ? { tmdb_id: existing.tmdb_id, title: existing.title, release_year: existing.release_year } : null,
  );
  const [posters, setPosters] = useState(baseOptions); // opciones para elegir (IG / actuales + TMDB + subidas)
  const [images, setImages] = useState(startImages); // elegidas, en el orden del carrusel
  const [reviewText, setReviewText] = useState(prefill?.text ?? existing?.review_text ?? "");
  const [soundtrack, setSoundtrack] = useState(existing?.soundtrack ?? "");
  const [mood, setMood] = useState(existing?.mood ?? "");
  const [date, setDate] = useState(existing ? toDateInput(existing.created_at) : "");
  const [busy, setBusy] = useState(""); // "", "buscando", "subiendo", "publicando" o "Subiendo fotos 2/8"
  const [error, setError] = useState("");
  const uploadedRef = useRef({}); // fotos de IG ya subidas: { "ig:...": "https://res.cloudinary..." }

  const isTv = mediaType === "tv";
  const noun = isTv ? "serie" : "película";

  // Paso 1: buscar en TMDB (películas o series)
  async function runSearch(text, type = mediaType) {
    if (text.trim().length < 2) return;
    setBusy("buscando");
    setError("");
    const params = new URLSearchParams({ q: text.trim(), type });
    const res = await fetch(`/api/movies/search?${params}`);
    setBusy("");
    if (!res.ok) return setError("No se pudo buscar en TMDB");
    let list = await res.json();
    // Si sabemos el año (del post de IG), los que coinciden van primero
    if (prefill?.year) {
      const y = String(prefill.year);
      list = [...list.filter((m) => m.release_year === y), ...list.filter((m) => m.release_year !== y)];
    }
    setResults(list);
  }

  function handleSearch(e) {
    e.preventDefault();
    runSearch(query);
  }

  // Al abrir: con prefill buscamos en TMDB; al editar traemos los afiches de TMDB como opciones
  useEffect(() => {
    if (prefill?.title) runSearch(prefill.title);
    if (existing) loadTmdbPosters(existing.tmdb_id, existing.media_type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeType(type) {
    if (type === mediaType) return;
    setMediaType(type);
    setMovie(null);
    setResults([]);
    setPosters(baseOptions);
    setImages(startImages);
    if (query.trim()) runSearch(query, type);
  }

  async function loadTmdbPosters(tmdbId, type) {
    const res = await fetch(`/api/movies/${tmdbId}/images${type === "tv" ? "?type=tv" : ""}`);
    if (!res.ok) return;
    const tmdb = (await res.json()).filter((p) => !baseUrls.has(p.url));
    setPosters([...baseOptions, ...tmdb]);
  }

  async function selectMovie(m) {
    setMovie(m);
    setResults([]);
    // Las fotos de IG (o las que ya tenía la reseña) se mantienen;
    // los afiches de TMDB se cambian por los de esta película/serie
    setPosters(baseOptions);
    setImages((prev) => prev.filter((u) => baseUrls.has(u)));
    loadTmdbPosters(m.tmdb_id, mediaType);
  }

  // Paso 2: marcar / desmarcar una imagen (el orden de los clics = orden del carrusel)
  function toggleImage(url) {
    setImages((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url);
      if (prev.length >= MAX_IMAGES) return prev;
      return [...prev, url];
    });
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite volver a elegir el mismo archivo
    setBusy("subiendo");
    setError("");
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Falló la subida de una imagen");
        continue;
      }
      const { url } = await res.json();
      setPosters((prev) => [{ url, language: "propia" }, ...prev]);
      setImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, url]));
    }
    setBusy("");
  }

  // Sube a Cloudinary las fotos de IG elegidas (solo esas) y devuelve las URLs finales.
  async function uploadIgImages() {
    const igChosen = images.filter((u) => u.startsWith(IG_PREFIX));
    let done = 0;
    for (const u of igChosen) {
      setBusy(`Subiendo fotos ${++done}/${igChosen.length}`);
      if (uploadedRef.current[u]) continue; // ya subida en un intento anterior
      const res = await fetch("/api/ig/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: u.slice(IG_PREFIX.length) }),
      });
      if (!res.ok) throw new Error("No se pudo subir una foto de IG a Cloudinary");
      uploadedRef.current[u] = (await res.json()).url;
    }
    return images.map((u) => uploadedRef.current[u] ?? u);
  }

  // Paso 3: publicar
  async function handleSubmit(e) {
    e.preventDefault();
    if (!movie) return setError(`Elige una ${noun}`);
    if (images.length === 0) return setError("Elige al menos una imagen");
    if (!reviewText.trim()) return setError("Escribe la reseña");

    setError("");
    let finalImages;
    try {
      finalImages = await uploadIgImages();
    } catch (err) {
      setBusy("");
      return setError(err.message);
    }

    setBusy("publicando");
    const data = {
      tmdb_id: movie.tmdb_id,
      media_type: mediaType,
      review_text: reviewText.trim(),
      soundtrack_embed_url: soundtrack.trim() || null,
      images: finalImages,
    };
    const res = existing
      ? // Editar: también mood y fecha (la fecha solo si la cambiaste, para no mover la hora)
        await fetch(`/api/reviews/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            mood,
            ...(date !== toDateInput(existing.created_at) && { created_at: new Date(`${date}T12:00:00`).toISOString() }),
          }),
        })
      : await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, ig_post_id: prefill?.igPostId ?? null }),
        });
    setBusy("");

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error ?? "No se pudo publicar");
    }
    const saved = await res.json();
    // Importando de IG: volvemos a la lista para seguir con el próximo post
    router.push(prefill ? "/admin/importar" : `/reviews/${saved.id}`);
    router.refresh();
  }

  const typeButton = (type, label) => (
    <button
      type="button"
      onClick={() => changeType(type)}
      className={`rounded px-3 py-1 text-sm ${mediaType === type ? "bg-white text-black" : "bg-neutral-800 text-neutral-300"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <h1 className="text-xl font-medium">
        {existing ? "Editar reseña" : prefill ? "Importar reseña de Instagram" : "Nueva reseña"}
      </h1>

      {/* Paso 1 */}
      <section>
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-sm text-neutral-400">1. ¿Película o serie?</h2>
          {typeButton("movie", "Película")}
          {typeButton("tv", "Serie")}
        </div>
        {movie ? (
          <div className="flex items-center gap-3">
            <p>
              <strong>{movie.title}</strong> {movie.release_year && `(${movie.release_year})`}
            </p>
            <button type="button" onClick={() => setMovie(null)} className="text-sm underline">
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar ${noun} en TMDB...`}
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 p-2"
              />
              <button disabled={busy === "buscando"} className="rounded bg-white px-4 text-black disabled:opacity-50">
                {busy === "buscando" ? "..." : "Buscar"}
              </button>
            </form>
            {prefill?.altTitle && (
              <button
                type="button"
                onClick={() => {
                  setQuery(prefill.altTitle);
                  runSearch(prefill.altTitle);
                }}
                className="mt-1 text-xs text-neutral-400 underline"
              >
                Probar con el título en español: “{prefill.altTitle}”
              </button>
            )}
            {prefill && !busy && results.length === 0 && (
              <p className="mt-2 text-sm text-neutral-500">
                No hubo resultados. Corrige el título, o cambia entre Película / Serie.
              </p>
            )}
            <ul className="mt-2 flex flex-col">
              {results.map((m) => (
                <li key={m.tmdb_id}>
                  <button
                    type="button"
                    onClick={() => selectMovie(m)}
                    className="flex w-full items-center gap-3 rounded p-2 text-left hover:bg-neutral-900"
                  >
                    {m.poster_url ? (
                      <img src={m.poster_url} alt="" className="h-16 w-11 object-cover" />
                    ) : (
                      <div className="h-16 w-11 bg-neutral-800" />
                    )}
                    <span>
                      {m.title} <span className="text-neutral-400">{m.release_year}</span>
                      {prefill?.year && m.release_year === String(prefill.year) && (
                        <span className="ml-2 rounded bg-neutral-800 px-1.5 text-xs">coincide el año</span>
                      )}
                      {m.original_title && m.original_title !== m.title && (
                        <span className="block text-xs text-neutral-500">{m.original_title}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Paso 2 */}
      {(movie || baseOptions.length > 0) && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm text-neutral-400">
              2. Imágenes ({images.length}/{MAX_IMAGES}) — la n.º 1 es la portada
              {igOptions.length > 0 && " · las de IG van primero"}
              {existing && " · las actuales van primero"}
            </h2>
            <label className="cursor-pointer rounded bg-neutral-800 px-3 py-1 text-sm">
              {busy === "subiendo" ? "Subiendo..." : "Subir propias"}
              <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </label>
          </div>
          {movie && posters.length === 0 && (
            <p className="text-sm text-neutral-500">TMDB no tiene afiches para esta {noun}. Sube los tuyos.</p>
          )}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {posters.map((p) => {
              const order = images.indexOf(p.url);
              return (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => toggleImage(p.url)}
                  className={`relative overflow-hidden rounded ${order >= 0 ? "ring-2 ring-white" : "opacity-70 hover:opacity-100"}`}
                >
                  <img src={p.preview ?? p.url} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover" />
                  {order >= 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-white px-2 text-xs text-black">
                      {order + 1}
                    </span>
                  )}
                  {p.language === "instagram" && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px]">IG</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Paso 3 */}
      {movie && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h2 className="text-sm text-neutral-400">3. Reseña</h2>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={prefill ? 16 : 8}
            placeholder="Tu reseña..."
            className="rounded border border-neutral-700 bg-neutral-900 p-2"
          />
          <input
            value={soundtrack}
            onChange={(e) => setSoundtrack(e.target.value)}
            placeholder="Link de Spotify o YouTube (opcional)"
            className="rounded border border-neutral-700 bg-neutral-900 p-2"
          />
          {existing && (
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                Mood
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="rounded border border-neutral-700 bg-neutral-900 p-2"
                >
                  {Object.entries(MOOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                Fecha
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="rounded border border-neutral-700 bg-neutral-900 p-2"
                />
              </label>
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={busy !== ""}
            className="self-start rounded bg-white px-4 py-2 text-black disabled:opacity-50"
          >
            {busy === "publicando"
              ? existing ? "Guardando..." : "Publicando..."
              : busy.startsWith("Subiendo fotos") ? busy : existing ? "Guardar cambios" : "Publicar"}
          </button>
        </form>
      )}

      {!movie && error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
