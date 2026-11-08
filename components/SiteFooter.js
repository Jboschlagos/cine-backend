import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { InstagramIcon, GitHubIcon, LinkedInIcon } from "@/components/icons";

const linkClass = "transition-colors hover:text-white";

// Footer compacto, espejo del navbar (SiteHeader): mismo ancho (max-w-6xl px-4),
// misma línea (border neutral-900) y la misma tipografía en mayúsculas espaciadas.
// En celular va todo apilado y centrado; desde sm, izquierda y derecha.
// pb-16 deja libre el espacio del botón minimizado del reproductor (abajo a la derecha);
// cuando la barra está desplegada, SoundtrackPlayer agrega su propio espacio al final.
export default function SiteFooter() {
  const external = { target: "_blank", rel: "noopener noreferrer" };

  return (
    <footer className="mt-12 border-t border-neutral-900 font-display text-xs uppercase tracking-[0.15em] text-neutral-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-16 pt-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <span>Hecho por Jorge</span>
            <a href={SITE.instagram} {...external} aria-label="Instagram" className={linkClass}>
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a href={SITE.github} {...external} aria-label="GitHub" className={linkClass}>
              <GitHubIcon className="h-4 w-4" />
            </a>
            <a href={SITE.linkedin} {...external} aria-label="LinkedIn" className={linkClass}>
              <LinkedInIcon className="h-4 w-4" />
            </a>
            <Link href="/contacto" className={linkClass}>
              Escríbeme
            </Link>
          </div>

          <p>
            Datos:{" "}
            <a href="https://www.themoviedb.org" {...external} className={linkClass}>TMDB</a>
            {" · "}
            <a href="https://www.justwatch.com" {...external} className={linkClass}>JustWatch</a>
            {" · "}
            <a href="https://musicbrainz.org" {...external} className={linkClass}>MusicBrainz</a>
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 text-center text-[11px] normal-case tracking-normal text-neutral-500 sm:flex-row sm:justify-between sm:text-left">
          {/* TMDB pide mostrar su logo y este aviso: ver https://www.themoviedb.org/about/logos-attribution
              El logo es el archivo oficial (public/tmdb-logo.svg), sin cambiarle el color, y más chico que el nuestro. */}
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <a href="https://www.themoviedb.org" {...external} aria-label="The Movie Database (TMDB)" className="shrink-0">
              <Image src="/tmdb-logo.svg" alt="TMDB" width={37} height={16} unoptimized className="h-4 w-auto" />
            </a>
            <p>Este sitio usa la API de TMDB, pero no está respaldado ni certificado por TMDB.</p>
          </div>
          <p>{SITE.name} es un experimento — se arma y se desarma sobre la marcha.</p>
        </div>
      </div>
    </footer>
  );
}
