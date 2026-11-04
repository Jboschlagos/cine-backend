"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Botones Editar / Borrar en la página de una reseña.
// Solo se muestra cuando tienes la sesión de admin iniciada (lo decide la página).
export default function ReviewAdminBar({ id, title, fromInstagram }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const extra = fromInstagram ? "\n\nEl post de Instagram volverá a Pendientes." : "";
    if (!window.confirm(`¿Borrar la reseña de "${title}"? También se borran sus fotos y comentarios.${extra}`)) return;

    setBusy(true);
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError("No se pudo borrar.");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded border border-neutral-800 px-3 py-2 text-sm">
      <span className="text-neutral-500">Admin:</span>
      <Link href={`/admin/editar/${id}`} className="rounded bg-white px-3 py-1 text-black">
        Editar
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="rounded px-3 py-1 text-red-400 hover:bg-red-950 disabled:opacity-50"
      >
        {busy ? "Borrando..." : "Borrar"}
      </button>
      {error && <span className="text-red-400">{error}</span>}
    </div>
  );
}
