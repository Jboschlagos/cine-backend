import Link from "next/link";
import { notFound } from "next/navigation";
import { discoverMovies, searchMoviesPage, getRecommendations, getPersonCredits } from "@/lib/tmdb";
import { getReviewedTmdbIds, getReviews } from "@/lib/reviews";
import ActiveFilters from "@/components/ActiveFilters";
import PersonResults from "@/components/PersonResults";
import {
  FILTERS,
  NAME_FILTERS,
  readPersona,
  reviewsHref,
  toReviewFilters,
  readComo,
  filterByMood,
  COMO_SEGMENTS,
  readFilters,
  readMediaType,
  readSearch,
  toDiscoverFilters,
  toQuery,
  mediaTypeParams,
  DISCOVER_SEGMENTS,
} from "@/lib/filters";
import DiscoverGrid from "@/components/DiscoverGrid";
import MoodFilter from "@/components/MoodFilter";
import BrowseHeader, { RIGHT_COLUMN_CLASS } from "@/components/BrowseHeader";

const SORT_LABELS = {
  "popularity.desc": "más populares",
  "vote_average.desc": "mejor calificadas",
  "primary_release_date.desc": "más recientes",
  "first_air_date.desc": "más recientes",
};

// Título de la pestaña: con el template del layout queda "Descubrir · Reducido".
export const metadata = { title: "Descubrir" };

// Recomendaciones de TMDB a partir de una película o serie (?como=),
// filtradas por mood y con las que ya reseñaste marcadas.
// Devuelve lo mismo que discoverMovies (una sola página) + como: { title, unsupported }.
async function comoResults(tmdbId, type, mood) {
  const rec = await getRecommendations(tmdbId, type);
  if (!rec) notFound(); // ese id no existe en TMDB
  const { results, unsupported } = filterByMood(rec.results, mood, type);
  const reviewed = await getReviewedTmdbIds(results.map((m) => m.tmdb_id), type);
  return {
    results: results.map((m) => ({ ...m, reviewed_id: reviewed.get(m.tmdb_id) ?? null })),
    sort_used: null,
    page: 1,
    total_pages: 1,
    como: { title: rec.title, unsupported },
  };
}

// Vista de persona (?persona=&rol=): tus reseñas con ella (buscadas por nombre, con el
// mismo filtro de la portada) + sus películas en TMDB, sin las que ya reseñaste (por tmdb_id).
async function personResults({ id, rol }, type) {
  const person = await getPersonCredits(id, rol, type);
  if (!person) notFound(); // esa persona no existe en TMDB
  const names = { [rol]: person.name }; // ej. { director: "Robert Zemeckis" }
  const [mine, reviewed] = await Promise.all([
    getReviews(toReviewFilters({}, names), { mediaType: type }),
    getReviewedTmdbIds(person.results.map((m) => m.tmdb_id), type),
  ]);
  return {
    name: person.name,
    names,
    mine,
    tmdbResults: person.results.filter((m) => !reviewed.has(m.tmdb_id)),
  };
}

export default async function DiscoverPage({ searchParams }) {
  const params = await searchParams;
  const type = readMediaType(params);
  const isTv = type === "tv";
  const noun = isTv ? "series" : "películas";
  const typeParams = mediaTypeParams(type); // {} o { tipo: "serie" }
  const q = readSearch(params);
  // Vista de persona: ?persona=<id de TMDB>&rol=director|compositor|actor.
  const persona = q ? null : readPersona(params);
  // "Descubrir más como esta": ?como=<id de TMDB>. La búsqueda y la persona tienen prioridad.
  const como = q || persona ? null : readComo(params);
  // Con "Como" solo se puede elegir el mood (ver COMO_SEGMENTS en lib/filters.js).
  const segments = como ? COMO_SEGMENTS : DISCOVER_SEGMENTS[type];
  // Si hay búsqueda, los filtros no aplican (TMDB no permite combinarlos).
  const active = q ? {} : readFilters(params, segments);

  // Link para cambiar de tipo: conserva búsqueda y filtros que apliquen al otro tipo
  // (o la persona, que también tiene series).
  const typeHref = (nextType) => {
    if (persona) {
      return `/discover?${toQuery({ persona: String(persona.id), rol: persona.rol, ...mediaTypeParams(nextType) })}`;
    }
    const allowed = DISCOVER_SEGMENTS[nextType];
    const kept = Object.fromEntries(Object.entries(active).filter(([name]) => allowed.includes(name)));
    const next = toQuery({ ...(q ? { q } : kept), ...mediaTypeParams(nextType) });
    return next ? `/discover?${next}` : "/discover";
  };
  const search = {
    action: "/discover",
    q,
    keep: typeParams,
    placeholder: isTv ? "Buscar cualquier serie" : "Buscar cualquier película",
  };

  if (persona) {
    const person = await personResults(persona, type);
    const label = isTv && persona.rol === "director" ? "Creación" : NAME_FILTERS[persona.rol];
    return (
      <main>
        {/* Sin la frase "Hoy quiero…": arriba solo "DIRECTOR: ROBERT ZEMECKIS ✕" */}
        <BrowseHeader type={type} typeHref={typeHref} search={search} phraseRow={false}>
          <ActiveFilters
            items={[{ name: "persona", label, value: person.name, href: isTv ? "/discover?tipo=serie" : "/discover" }]}
            className={`pt-5 ${RIGHT_COLUMN_CLASS}`}
          />
        </BrowseHeader>
        <PersonResults
          name={person.name}
          mine={person.mine}
          allHref={reviewsHref(person.names, type)}
          tmdbResults={person.tmdbResults}
          noun={noun}
          personKey={`${persona.id}-${persona.rol}-${type}`}
        />
      </main>
    );
  }

  let data;
  let comoInfo = null; // { title, unsupported } cuando hay "Como"
  if (q) {
    data = await searchMoviesPage(q, 1, type);
  } else if (como) {
    data = await comoResults(como, type, active.mood);
    comoInfo = data.como;
  } else {
    data = await discoverMovies(toDiscoverFilters(active, type), { type });
  }
  const { results, sort_used, page, total_pages } = data;
  // query va a "Ver más" (/api/discover): filtros o búsqueda + el tipo.
  // (Con "Como" no hay "Ver más": las recomendaciones llegan todas de una vez.)
  const query = q ? toQuery({ q, ...typeParams }) : toQuery({ ...active, ...typeParams });
  // Link para quitar "Como": la misma página con el mood y el tipo, sin "como".
  const quitComoHref = query ? `/discover?${query}` : "/discover";

  const clearSearchHref = isTv ? `/discover?${toQuery(typeParams)}` : "/discover";

  return (
    <main>
      <BrowseHeader type={type} typeHref={typeHref} search={search} phraseRow={!q}>
        {q ? (
          <p className={`mx-auto max-w-2xl px-4 pb-6 pt-5 text-center font-display text-xs uppercase tracking-[0.2em] text-neutral-400 ${RIGHT_COLUMN_CLASS}`}>
            Resultados para “{q}” ·{" "}
            <Link href={clearSearchHref} className="border-b border-neutral-700 hover:text-white">
              Limpiar búsqueda
            </Link>
          </p>
        ) : (
          <>
            {/* extra = el tipo (y "Como"): los links de los filtros y "Limpiar filtros" lo conservan */}
            <MoodFilter
              basePath="/discover"
              prefix="Hoy quiero descubrir algo"
              active={active}
              segments={segments}
              extra={como ? { ...typeParams, como: String(como) } : typeParams}
              className={RIGHT_COLUMN_CLASS}
              oneLineXl
            />
            {/* "COMO: LEÓN: EL PROFESIONAL ✕" */}
            {comoInfo && (
              <ActiveFilters
                items={[{ name: "como", label: "Como", value: comoInfo.title, href: quitComoHref }]}
                className={RIGHT_COLUMN_CLASS}
              />
            )}
          </>
        )}
      </BrowseHeader>

      {!q && !como && (
        // Cada visita elige al azar la página y el orden de TMDB; acá se dice cuál tocó.
        <p className="mx-auto max-w-2xl px-4 pb-6 text-center text-xs text-neutral-400">
          Todo al azar, para descubrir más allá de la taquilla · esta vez:{" "}
          {SORT_LABELS[sort_used] ?? sort_used}.
        </p>
      )}

      {results.length === 0 && (
        <p className="px-4 pb-6 text-center text-sm text-neutral-400">
          {q
            ? `No encontramos ${noun} con ese título.`
            : comoInfo?.unsupported
              ? `El mood “${FILTERS.mood.options[active.mood]}” no se puede combinar con “Como”. Prueba con otro.`
              : comoInfo
                ? `No hay recomendaciones con ese mood. Prueba con otro o quítalo.`
                : `No encontramos ${noun} con esa combinación. Prueba quitando algún filtro.`}
        </p>
      )}
      {/* "key" hace que la grilla parta de cero al cambiar el tipo, los filtros o la búsqueda */}
      <DiscoverGrid
        key={`${query}-${sort_used}-${page}`}
        initial={results}
        query={query}
        sort={sort_used}
        page={page}
        totalPages={total_pages}
        noun={noun}
      />
    </main>
  );
}
