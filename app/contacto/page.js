import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contacto" };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-4 text-center font-display text-sm uppercase tracking-[0.35em] text-neutral-500">
        Escríbeme
      </h1>
      <p className="mb-10 text-center text-neutral-400">
        Una recomendación, una corrección, una banda sonora que no puedo dejar de escuchar…
      </p>
      <ContactForm />
    </main>
  );
}
