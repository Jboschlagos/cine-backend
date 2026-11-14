import Link from "next/link";

// Filtros por nombre activos en la portada: "DIRECTOR: LUC BESSON ✕ · ACTOR: JEAN RENO ✕".
// Cada ✕ quita solo ese filtro; con más de uno aparece "Quitar todos".
// items = [{ name, label, value, href }] (href = la misma página sin ese filtro)
export default function ActiveFilters({ items, clearHref, className = "" }) {
  if (items.length === 0) return null;

  return (
    <p
      className={`mx-auto max-w-3xl px-4 pb-5 text-center font-display text-xs uppercase leading-loose tracking-[0.2em] text-neutral-500 ${className}`}
    >
      {items.map((item, i) => (
        <span key={item.name}>
          {i > 0 && " · "}
          {item.label}: <span className="text-white">{item.value}</span>{" "}
          <Link
            href={item.href}
            aria-label={`Quitar filtro ${item.label}: ${item.value}`}
            className="transition-colors hover:text-white"
          >
            ✕
          </Link>
        </span>
      ))}
      {items.length > 1 && (
        <>
          {" · "}
          <Link href={clearHref} className="border-b border-neutral-700 transition-colors hover:text-white">
            Quitar todos
          </Link>
        </>
      )}
    </p>
  );
}
