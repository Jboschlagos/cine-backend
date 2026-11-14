import Link from "next/link";

// Página 404: se muestra con cualquier URL que no existe y cuando una página llama
// a notFound() (ej. /reviews/999999 o /discover?como=<id inexistente>).
// Va dentro del layout, así que conserva el navbar, el footer y el reproductor.
// La pestaña muestra el título del sitio (en Next 16, not-found.js no acepta "metadata").
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="font-display text-xs uppercase tracking-[0.4em] text-neutral-500">404</p>
      <h1 className="font-display text-2xl uppercase leading-snug tracking-[0.2em] text-white sm:text-3xl">
        Esta escena se cortó en la edición
      </h1>
      <p className="text-sm text-neutral-400">La página que buscas no llegó al montaje final.</p>
      <Link
        href="/"
        className="mt-2 border-b border-neutral-600 pb-1 font-display text-xs uppercase tracking-[0.2em] text-neutral-300 transition-colors hover:border-white hover:text-white"
      >
        ← Volver al inicio
      </Link>
    </main>
  );
}
