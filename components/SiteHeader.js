"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { InstagramIcon } from "@/components/icons";
import Logo from "@/components/Logo";
import AdminLink from "@/components/AdminLink";

const LINKS = [
  // Series está dentro de Reseñas (/?tipo=serie), con el selector Películas | Series.
  { href: "/", label: "Reseñas" },
  { href: "/discover", label: "Descubrir" },
  { href: "/sobre-mi", label: "Sobre mí" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  // Guardamos la ruta donde se abrió el menú del celular: si cambias de
  // página deja de coincidir y el menú queda cerrado, sin useEffect.
  const [openAt, setOpenAt] = useState(null);
  const menuOpen = openAt === pathname;
  const closeMenu = () => setOpenAt(null);

  // "Reseñas" queda marcado también cuando estás dentro de una reseña.
  const isActive = (href) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/reviews")
      : pathname.startsWith(href);

  // Mismo estilo para todos los links del menú (incluido "Admin").
  const linkClass = (href) =>
    `text-xs tracking-[0.15em] transition-colors ${
      isActive(href) ? "text-white" : "text-neutral-400 hover:text-white"
    }`;

  const links = LINKS.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      onClick={closeMenu}
      aria-current={isActive(href) ? "page" : undefined}
      className={linkClass(href)}
    >
      {label}
    </Link>
  ));

  // Solo se ve con tu sesión iniciada (ver components/AdminLink.js).
  const adminLink = (
    <AdminLink onClick={closeMenu} active={isActive("/admin")} className={linkClass("/admin")} />
  );

  const instagram = (
    <a
      href={SITE.instagram}
      target="_blank"
      rel="noopener noreferrer"
      onClick={closeMenu}
      aria-label="Instagram"
      className="text-neutral-400 transition-colors hover:text-white"
    >
      <InstagramIcon className="h-4 w-4" />
    </a>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-900 bg-black/85 font-display uppercase backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Izquierda: logo y, debajo, la frase del sitio (más chica y apagada) */}
        <Link
          href="/"
          aria-label={`${SITE.name}, ${SITE.tagline}, inicio`}
          className="flex flex-col items-center gap-1 text-white"
        >
          <Logo className="h-7 w-auto sm:h-8" />
          <span className="text-[10px] leading-none tracking-[0.3em] text-neutral-500">
            {SITE.tagline}
          </span>
        </Link>

        {/* Derecha, en pantallas de 768px o más ("md") */}
        <div className="hidden items-center gap-6 md:flex">
          {links}
          {adminLink}
          {instagram}
        </div>

        {/* Botón ☰ solo en celular */}
        <button
          type="button"
          onClick={() => setOpenAt(menuOpen ? null : pathname)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="text-2xl leading-none text-neutral-300 hover:text-white md:hidden"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </nav>

      {/* Menú desplegable del celular */}
      {menuOpen && (
        <div id="mobile-menu" className="flex flex-col gap-5 border-t border-neutral-900 px-4 py-6 md:hidden">
          {links}
          {adminLink}
          {instagram}
        </div>
      )}
    </header>
  );
}
