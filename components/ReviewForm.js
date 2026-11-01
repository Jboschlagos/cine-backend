"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_IMAGES = 10;

// Formulario del admin para publicar una reseña, en 3 pasos:
// 1) buscar la película en TMDB, 2) elegir/subir imágenes, 3) reseña + soundtrack.
export default function ReviewForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [movie, setMovie] = useState(null);
  const [posters, setPosters] = useState([]); // opciones para elegir (TMDB + subidas)
  const [images, setImages] = useState([]); // URLs elegidas, en el orden del carrusel
  const [reviewText, setReviewText] = useState("");
  const [soundtrack, setSoundtrack] = useState("");
  const [busy, setBusy] = useState(""); // "", "buscando", "subiendo", "publicando"
  const [error, setError] = useState("");

  // Paso 1: buscar en TMDB
  async function handleSearch(e) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setBusy("buscando");
    setError("");
    const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query.trim())}`);
    setBusy("");
    if (!res.ok) return setError("No se pudo buscar en TMDB");
    setResults(await res.json());
  }

  async function selectMovie(m) {
    setMovie(m);
    setResults([]);
    setImages([]);
    setPosters([]);
    const res = await fetch(`/api/movies/${m.tmdb_id}/images`);
    if (res.ok) setPosters(await res.json());
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

  // Paso 3: publicar
  async function handleSubmit(e) {
    e.preventDefault();
    if (!movie) return setError("Elige una película");
    if (images.length === 0) return setError("Elige al menos una imagen");
    if (!reviewText.trim()) return setError("Escribe la reseña");

    setBusy("publicando");
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdb_id: movie.tmdb_id,
        review_text: reviewText.trim(),
        soundtrack_embed_url: soundtrack.trim() || null,
        images,
      }),
    });
    setBusy("");

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error ?? "No se pudo publicar");
    }
    const created = await res.json();
    router.push(`/reviews/${created.id}`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <h1 className="text-xl font-medium">Nueva reseña</h1>

      {/* Paso 1 */}
      <section>
        <h2 className="mb-2 text-sm text-neutral-400">1. Película</h2>
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
                placeholder="Buscar en TMDB..."
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 p-2"
              />
              <button disabled={busy === "buscando"} className="rounded bg-white px-4 text-black disabled:opacity-50">
                {busy === "buscando" ? "..." : "Buscar"}
              </button>
            </form>
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
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Paso 2 */}
      {movie && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm text-neutral-400">
              2. Imágenes ({images.length}/{MAX_IMAGES}) — la n.º 1 es la portada
            </h2>
            <label className="cursor-pointer rounded bg-neutral-800 px-3 py-1 text-sm">
              {busy === "subiendo" ? "Subiendo..." : "Subir propias"}
              <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </label>
          </div>
          {posters.length === 0 && (
            <p className="text-sm text-neutral-500">TMDB no tiene afiches para esta película. Sube los tuyos.</p>
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
                  <img src={p.url} alt="" className="aspect-[2/3] w-full object-cover" />
                  {order >= 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-white px-2 text-xs text-black">
                      {order + 1}
                    </span>
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
            rows={8}
            placeholder="Tu reseña..."
            className="rounded border border-neutral-700 bg-neutral-900 p-2"
          />
          <input
            value={soundtrack}
            onChange={(e) => setSoundtrack(e.target.value)}
            placeholder="Link de Spotify o YouTube (opcional)"
            className="rounded border border-neutral-700 bg-neutral-900 p-2"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={busy !== ""}
            className="self-start rounded bg-white px-4 py-2 text-black disabled:opacity-50"
          >
            {busy === "publicando" ? "Publicando..." : "Publicar"}
          </button>
        </form>
      )}

      {!movie && error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
