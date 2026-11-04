import Form from "next/form";

// Buscador por título. Es un formulario GET: al apretar Enter cambia la URL
// a ?q=texto (next/form navega sin recargar la página).
// keep = parámetros que se conservan al buscar, ej. { mood: "tension" }.
export default function SearchBox({ action, q = "", keep = {}, placeholder = "Buscar por título" }) {
  return (
    <Form action={action} role="search" className="mx-auto flex max-w-sm items-center gap-2 px-4 pt-6">
      {Object.entries(keep).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label="Buscar por título"
        maxLength={100}
        className="w-full border-b border-neutral-700 bg-transparent py-1 text-center font-display text-xs uppercase tracking-[0.15em] text-white placeholder:text-neutral-600 focus:border-white focus:outline-none"
      />
      <button
        type="submit"
        className="font-display text-[10px] uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:text-white"
      >
        Buscar
      </button>
    </Form>
  );
}
