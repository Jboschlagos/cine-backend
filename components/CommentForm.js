"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Formulario público de comentarios (sin cuenta: solo nombre + texto).
export default function CommentForm({ reviewId }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setSending(true);
    setError("");

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        review_id: reviewId,
        name: form.get("name"),
        text: form.get("text"),
      }),
    });

    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar el comentario");
      return;
    }
    formEl.reset();
    router.refresh(); // vuelve a pedir la página al servidor -> aparece el comentario nuevo
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        name="name"
        placeholder="Tu nombre"
        required
        maxLength={80}
        className="rounded border border-neutral-700 bg-neutral-900 p-2"
      />
      <textarea
        name="text"
        placeholder="¿Qué te pareció?"
        required
        maxLength={2000}
        rows={3}
        className="rounded border border-neutral-700 bg-neutral-900 p-2"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        disabled={sending}
        className="self-start rounded bg-white px-4 py-2 text-black disabled:opacity-50"
      >
        {sending ? "Enviando..." : "Comentar"}
      </button>
    </form>
  );
}
