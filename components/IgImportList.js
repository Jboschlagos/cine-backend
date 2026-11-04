"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const igImage = (path) => `/api/ig/image?path=${encodeURIComponent(path)}`;

// Lista de posts de IG con los botones Revisar / Descartar / Recuperar,
// y el botón para leer (o volver a leer) la exportación.
export default function IgImportList({ posts, status, isEmpty }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null); // id del post en proceso, o "sync"
  const [message, setMessage] = useState("");

  async function sync() {
    setBusy("sync");
    setMessage("");
    const res = await fetch("/api/ig/sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    setMessage(res.ok ? `Listo: ${data.added} posts nuevos (de ${data.total} en la exportación).` : data.error);
    router.refresh();
  }

  async function setStatus(id, next) {
    setBusy(id);
    const res = await fetch(`/api/ig/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(null);
    if (!res.ok) return setMessage("No se pudo cambiar el post.");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={sync}
          disabled={busy === "sync"}
          className="rounded bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700 disabled:opacity-50"
        >
          {busy === "sync" ? "Leyendo..." : isEmpty ? "Leer exportación de IG" : "Volver a leer exportación"}
        </button>
        {message && <p className="text-sm text-neutral-400">{message}</p>}
      </div>

      {posts.length === 0 && <p className="text-sm text-neutral-500">No hay posts en esta lista.</p>}

      <ul className="flex flex-col divide-y divide-neutral-900">
        {posts.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-3">
            {p.cover ? (
              <img src={igImage(p.cover)} alt="" loading="lazy" className="h-20 w-16 flex-none rounded object-cover" />
            ) : (
              <div className="h-20 w-16 flex-none rounded bg-neutral-800" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate">
                <strong>{p.title_guess || "(sin título)"}</strong>{" "}
                {p.year_guess && <span className="text-neutral-400">({p.year_guess})</span>}{" "}
                {p.series_guess && <span className="rounded bg-neutral-800 px-1.5 text-xs">serie</span>}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {new Date(p.posted_at).toLocaleDateString("es-CL")} · {p.n_images} fotos · {p.snippet}
              </p>
            </div>
            <div className="flex flex-none gap-2 text-sm">
              {status === "pendiente" && (
                <>
                  <Link href={`/admin/importar/${p.id}`} className="rounded bg-white px-3 py-1 text-black">
                    Revisar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setStatus(p.id, "descartado")}
                    disabled={busy === p.id}
                    className="rounded px-3 py-1 text-neutral-400 hover:text-white disabled:opacity-50"
                  >
                    Descartar
                  </button>
                </>
              )}
              {status === "descartado" && (
                <button
                  type="button"
                  onClick={() => setStatus(p.id, "pendiente")}
                  disabled={busy === p.id}
                  className="rounded px-3 py-1 text-neutral-400 hover:text-white disabled:opacity-50"
                >
                  Recuperar
                </button>
              )}
              {status === "publicado" && p.review_id && (
                <Link href={`/reviews/${p.review_id}`} className="px-3 py-1 text-neutral-400 underline hover:text-white">
                  Ver reseña
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
