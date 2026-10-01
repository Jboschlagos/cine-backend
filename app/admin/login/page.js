"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const { error } = await authClient.signIn.email({
      email: form.get("email"),
      password: form.get("password"),
    });

    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-medium">Acceso admin</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border border-neutral-700 bg-neutral-900 p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          required
          className="rounded border border-neutral-700 bg-neutral-900 p-2"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          disabled={loading}
          className="rounded bg-white p-2 text-black disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
