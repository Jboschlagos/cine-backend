"use client";

import { useState } from "react";

const field = "rounded border border-neutral-800 bg-neutral-950 p-3 focus:border-neutral-500 focus:outline-none";

export default function ContactForm() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setStatus("sending");
    setError("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar el mensaje.");
      setStatus("error");
      return;
    }
    formEl.reset();
    setStatus("sent");
  }

  if (status === "sent") {
    return <p className="text-center text-neutral-300">¡Gracias! Tu mensaje llegó. Te respondo apenas pueda.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input name="name" placeholder="Tu nombre" required maxLength={80} className={field} />
      <input name="email" type="email" placeholder="Tu correo (para responderte)" required maxLength={120} className={field} />
      <textarea name="message" placeholder="Tu mensaje" required maxLength={3000} rows={6} className={field} />
      {/* "Trampa" para bots: las personas no ven este campo; si viene lleno, es spam */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        disabled={status === "sending"}
        className="self-center rounded-full bg-white px-6 py-2 font-display text-xs uppercase tracking-[0.2em] text-black disabled:opacity-50"
      >
        {status === "sending" ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
