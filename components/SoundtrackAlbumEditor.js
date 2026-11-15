"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

// En la ficha técnica, SOLO con tu sesión de admin: corregir a mano el álbum de Spotify.
// "Guardar" = usar el álbum o playlist del link pegado. "No tiene" = quitarlo y que no se busque más.
// onSaved(uri) actualiza la ficha al tiro (uri = null si marcaste "No tiene").
export default function SoundtrackAlbumEditor({ tmdbId, mediaType, onSaved }) {
  const { data: session, isPending } = authClient.useSession();
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (isPending || !session) return null;

  async function save(value) {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/soundtrack/album", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id: tmdbId, type: mediaType, link: value }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMessage(data.error ?? "No se pudo guardar.");
    onSaved(data.spotifyUri);
    setLink("");
    setMessage(data.spotifyUri ? "Guardado." : "Marcada como sin álbum.");
  }

  const button = "shrink-0 rounded-full bg-neutral-800 px-3 py-1 hover:bg-neutral-700 disabled:opacity-50";

  return (
    <div className="mt-4 border-t border-neutral-900 pt-3 text-xs text-neutral-400">
      <p className="mb-2">Admin · corregir el álbum de Spotify</p>
      <div className="flex flex-wrap gap-2">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Pegar link de álbum o playlist de Spotify"
          className="min-w-0 flex-1 rounded bg-neutral-900 px-3 py-1 text-white placeholder:text-neutral-500"
        />
        <button type="button" disabled={saving || !link.trim()} onClick={() => save(link)} className={button}>
          Guardar
        </button>
        <button type="button" disabled={saving} onClick={() => save("")} className={button}>
          No tiene
        </button>
      </div>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}
