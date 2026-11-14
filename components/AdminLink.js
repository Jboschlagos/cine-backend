"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// Link "Admin" del navbar: solo aparece si iniciaste sesión.
// La sesión se revisa en el navegador (useSession), así las páginas públicas
// siguen siendo estáticas y rápidas. Mientras carga (isPending) no muestra nada,
// para que los visitantes nunca lo vean aparecer y desaparecer.
export default function AdminLink({ className, onClick, active }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending || !session) return null;

  return (
    <Link
      href="/admin"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      Admin
    </Link>
  );
}
