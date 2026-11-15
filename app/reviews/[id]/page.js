import Link from "next/link";
import { notFound } from "next/navigation";
import { FILTERS, reviewsHref, yearToEra, toQuery, mediaTypeParams } from "@/lib/filters";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import ReviewAdminBar from "@/components/ReviewAdminBar";
import { sql } from "@/lib/db";
import { MOOD_LABELS } from "@/lib/mood";
import { toEmbedUrl } from "@/lib/embed";
import ImageCarousel from "@/components/ImageCarousel";
import CommentForm from "@/components/CommentForm";
import MovieSheet from "@/components/MovieSheet";
import { getReview, getReviewImages, getSimilarReviews } from "@/lib/reviews";
import SimilarReviews from "@/components/SimilarReviews";
import Trailer from "@/components/Trailer";
import { getTrailer } from "@/lib/tmdb";
import { toShareImage } from "@/lib/reviewImages";
import { OPEN_GRAPH_BASE } from "@/lib/site";

// Se guardan 5 actores (lib/tmdb.js), pero aquí mostramos 3.
const SHOWN_ACTORS = 3;
const BUTTON_CLASS = "rounded-full bg-neutral-800 px-4 py-1.5 text-sm hover:bg-neutral-700";
const LINK_CLASS ="border-b border-neutral-700 transition-colors hover:border-white hover:text-white";

// "Joel Coen, Ethan Coen" -> ["Joel Coen", "Ethan Coen"] (así se guardan director y compositor)
const splitNames = (s) => (s ? s.split(", ").filter(Boolean) : []);

// Lista de links separados por coma: "Drama, Crimen"
function joinLinks(values, hrefFor) {
  return values.map((value, i) => (
    <span key={value}>
      {i > 0 && ", "}
      <Link href={hrefFor(value)} className={LINK_CLASS}>
        {value}
      </Link>
    </span>
  ));
}

// Si no hay imágenes guardadas, usamos el afiche de TMDB como respaldo.
function withPosterFallback(images, review) {
  if (images.length > 0) return images;
  return review.poster_url ? [review.poster_url] : [];
}

// "Una película preciosa sobre…" : primeras ~150 letras, sin cortar palabras.
function excerpt(text, max = 150) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s.,;:—-]+$/, "")}…`;
}

// Vista previa al compartir esta reseña: título, extracto y su primera imagen.
export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  // Mismas funciones que la página: gracias a cache() no se consulta dos veces.
  const [review, images] = await Promise.all([getReview(id), getReviewImages(id)]);
  if (!review) notFound();

  const description = excerpt(review.review_text);
  const cover = withPosterFallback(images, review)[0];
  const image = cover ? [{ ...toShareImage(cover), alt: review.title }] : undefined;

  return {
    title: review.title, // con el template del layout queda "Película · Reducido"
    description,
    openGraph: {
      ...OPEN_GRAPH_BASE,
      title: review.title,
      description,
      type: "article",
      url: `/reviews/${review.id}`,
      ...(image && { images: image }),
    },
    twitter: {
      card: "summary_large_image",
      title: review.title,
      description,
      ...(image && { images: image }),
    },
  };
}

// Página pública de una reseña: /reviews/123
export default async function ReviewPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound(); // si el id no es un número -> 404

  // Las consultas van en paralelo para que cargue más rápido.
  // session = tu sesión de admin (null para cualquier visitante).
  // El tráiler necesita el tmdb_id: se pide apenas llega la reseña, en paralelo con lo demás.
  // Si TMDB falla, la página igual se muestra (sin tráiler).
  const reviewPromise = getReview(id);
  const trailerPromise = reviewPromise.then((r) =>
    r ? getTrailer(r.tmdb_id, r.media_type).catch(() => null) : null,
  );
  const [review, images, similar, trailer, comments, session, igRows] = await Promise.all([
    reviewPromise,
    getReviewImages(id),
    getSimilarReviews(id), // "Si te gustó esta…"
    trailerPromise,
    sql`SELECT * FROM comments WHERE review_id = ${id} ORDER BY created_at ASC`,
    auth.api.getSession({ headers: await headers() }),
    sql`SELECT 1 FROM ig_posts WHERE review_id = ${id}`,
  ]);

  if (!review) notFound();

  const imageUrls = withPosterFallback(images, review);

  // Links a la portada filtrando tus reseñas (en series, a la pestaña Series).
  const filterHref = (params) => reviewsHref(params, review.media_type);
  const isTv = review.media_type === "tv";
  const era = yearToEra(review.release_year);
  const credits = [
    { label: isTv ? "Creación" : "Dirección", names: splitNames(review.director), param: "director" },
    { label: "Música", names: splitNames(review.composer), param: "compositor" },
    { label: "Reparto", names: (review.actors ?? []).slice(0, SHOWN_ACTORS), param: "actor" },
  ]
    .filter((c) => c.names.length > 0)
    .map(({ label, names, param }) => ({
      label,
      content: joinLinks(names, (name) => filterHref({ [param]: name })),
    }));
  if (era) {
    credits.push({
      label: "Año",
      content: (
        <Link
          href={filterHref({ era })}
          title={`Ver mis ${isTv ? "series" : "reseñas"} ${FILTERS.era.options[era]}`}
          className={LINK_CLASS}
        >
          {review.release_year}
        </Link>
      ),
    });
  }

  const embedUrl = toEmbedUrl(review.soundtrack_embed_url);
  const isSpotify = embedUrl?.includes("spotify.com");

  return (
    <main className="mx-auto max-w-5xl p-4">
      {/* Bloque 1: carrusel + reseña. El carrusel es "sticky" (te acompaña al bajar) y solo
          puede moverse DENTRO de este bloque: así nunca tapa "Si te gustó…", que va afuera. */}
      <div className="grid gap-6 md:grid-cols-2">
      <ImageCarousel images={imageUrls} alt={review.title} />

      <section className="flex flex-col gap-4">
        {session && <ReviewAdminBar id={review.id} title={review.title} fromInstagram={igRows.length > 0} />}
        <div>
          <h1 className="text-2xl font-medium">
            {review.title}{" "}
            {review.release_year && (
              <span className="text-neutral-300">({review.release_year})</span>
            )}
          </h1>
          {/* Mood y géneros: cada uno lleva a tus reseñas con ese mismo dato */}
          <p className="mt-1 text-sm text-neutral-300">
            {review.media_type === "tv" && "Serie · "}
            <Link href={filterHref({ mood: review.mood })} className={LINK_CLASS}>
              {MOOD_LABELS[review.mood]}
            </Link>
            {review.genres?.length > 0 && " · "}
            {joinLinks(review.genres ?? [], (g) => filterHref({ genero: g }))}
          </p>

          {/* Créditos: Dirección (o Creación en series) · Música · Reparto · Año */}
          {credits.length > 0 && (
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-display text-xs uppercase tracking-[0.15em] text-neutral-500">
              {credits.map(({ label, content }) => (
                <div key={label} className="flex gap-2">
                  <dt>{label}</dt>
                  <dd className="text-neutral-300">{content}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <MovieSheet
              tmdbId={review.tmdb_id}
              mediaType={review.media_type}
              showSoundtrack={false}
              showTrailer={false} // el tráiler ya está en la página, bajo la reseña escrita
              className={BUTTON_CLASS}
            >
              Ficha técnica
            </MovieSheet>
            {/* Recomendaciones de TMDB a partir de esta película o serie */}
            <Link href={`/discover?${toQuery({ como: review.tmdb_id, ...mediaTypeParams(review.media_type) })}`} className={BUTTON_CLASS}>
              Descubrir más como esta →
            </Link>
          </div>
        </div>

        <p className="whitespace-pre-line leading-relaxed">{review.review_text}</p>

        {/* Tráiler (si TMDB tiene uno): bajo la reseña escrita, arriba de la banda sonora */}
        {trailer && <Trailer videoKey={trailer.key} title={review.title} />}

        {embedUrl && (
          <iframe
            src={embedUrl}
            title={`Banda sonora de ${review.title}`}
            className={isSpotify ? "h-[152px] w-full rounded-xl" : "aspect-video w-full rounded-xl"}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        )}

        <div className="mt-4 border-t border-neutral-800 pt-4">
          <h2 className="mb-3 font-medium">Comentarios ({comments.length})</h2>
          <ul className="mb-4 flex flex-col gap-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded bg-neutral-900 p-3">
                <p className="text-sm">
                  <span className="font-medium">{c.name}</span>{" "}
                  <span className="text-neutral-400">
                    · {new Date(c.created_at).toLocaleDateString("es-CL")}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-200">{c.text}</p>
              </li>
            ))}
          </ul>
          <CommentForm reviewId={review.id} />
        </div>
      </section>

      </div>

      {/* Bloque 2: sección independiente, al final y a todo el ancho */}
      <SimilarReviews reviews={similar} mediaType={review.media_type} className="mt-16" />

    </main>
  );
}
