import Link from "next/link";
import { SITE } from "@/lib/site";
import { InstagramIcon, GitHubIcon, LinkedInIcon } from "@/components/icons";

const linkClass = "transition-colors hover:text-white";

export default function SiteFooter() {
  return (
    // mb-24 deja espacio para la barra del reproductor
    <footer className="mb-24 mt-20 border-t border-neutral-900 px-4 py-12 text-center font-display text-[11px] uppercase tracking-[0.15em] text-neutral-500">
      <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2">
          <h2 className="tracking-[0.3em] text-neutral-700">{SITE.name}</h2>
          <p>Reseñas, afiches y bandas sonoras</p>
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${linkClass}`}>
            <InstagramIcon className="h-4 w-4" /> @jboschlagos
          </a>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="tracking-[0.3em] text-neutral-700">Hecho por Jorge</h2>
          <div className="flex gap-4">
            <a href={SITE.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={linkClass}>
              <GitHubIcon className="h-4 w-4" />
            </a>
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={linkClass}>
              <LinkedInIcon className="h-4 w-4" />
            </a>
          </div>
          <Link href="/contacto" className={linkClass}>
            Escríbeme
          </Link>
        </div>

        <div className="flex flex-col items-center gap-2 normal-case tracking-normal">
          <h2 className="uppercase tracking-[0.3em] text-neutral-700">Datos</h2>
          {/* TMDB pide mostrar su logo y este aviso: ver https://www.themoviedb.org/about/logos-attribution */}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className={`font-sans text-xs ${linkClass}`}>
            Este sitio usa la API de TMDB, pero no está respaldado ni certificado por TMDB.
          </a>
          <p className="font-sans text-xs">
            Streaming: <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer" className={linkClass}>JustWatch</a>
            {" · "}Música: <a href="https://musicbrainz.org" target="_blank" rel="noopener noreferrer" className={linkClass}>MusicBrainz</a>
          </p>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-4xl border-t border-neutral-900 pt-6 text-neutral-600">
        {SITE.name} es un experimento — se arma y se desarma sobre la marcha.
      </p>
    </footer>
  );
}
