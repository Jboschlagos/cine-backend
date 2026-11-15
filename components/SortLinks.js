import Link from "next/link";
import { REVIEW_SORTS } from "@/lib/filters";

// "ORDENAR: RECIENTES · AÑO · TÍTULO" (escritorio). La opción activa va en blanco.
// current = orden activo; hrefFor(key) = link que cambia solo el orden y mantiene lo demás.
export default function SortLinks({ current, hrefFor, className = "" }) {
  return (
    <p className={`flex shrink-0 gap-3 font-display text-[11px] uppercase tracking-[0.2em] text-neutral-500 ${className}`}>
      Ordenar:
      {Object.entries(REVIEW_SORTS).map(([key, label]) => (
        <Link
          key={key}
          href={hrefFor(key)}
          aria-current={current === key ? "true" : undefined}
          className={current === key ? "text-white" : "transition-colors hover:text-white"}
        >
          {label}
        </Link>
      ))}
    </p>
  );
}
