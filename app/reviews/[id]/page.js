import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import ReviewAdminBar from "@/components/ReviewAdminBar";
import { sql } from "@/lib/db";
import { MOOD_LABELS } from "@/lib/mood";
import { toEmbedUrl } from "@/lib/embed";
import ImageCarousel from "@/components/ImageCarousel";
import CommentForm from "@/components/CommentForm";
import MovieSheet from "@/components/MovieSheet";
import { getReview, getReviewImages } from "@/lib/reviews";
import { toShareImage } from "@/lib/reviewImages";
import { OPEN_GRAPH_BASE } from "@/lib/site";

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
  const [review, images, comments, session, igRows] = await Promise.all([
    getReview(id),
    getReviewImages(id),
    sql`SELECT * FROM comments WHERE review_id = ${id} ORDER BY created_at ASC`,
    auth.api.getSession({ headers: await headers() }),
    sql`SELECT 1 FROM ig_posts WHERE review_id = ${id}`,
  ]);

  if (!review) notFound();

  const imageUrls = withPosterFallback(images, review);

  const embedUrl = toEmbedUrl(review.soundtrack_embed_url);
  const isSpotify = embedUrl?.includes("spotify.com");

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-2">
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
          <p className="mt-1 text-sm text-neutral-300">
            {review.media_type === "tv" && "Serie · "}
            {MOOD_LABELS[review.mood]}
            {review.genres?.length > 0 && ` · ${review.genres.join(", ")}`}
          </p>
          <MovieSheet
            tmdbId={review.tmdb_id}
            mediaType={review.media_type}
            showSoundtrack={false}
            className="mt-3 rounded-full bg-neutral-800 px-4 py-1.5 text-sm hover:bg-neutral-700"
          >
            Ficha técnica
          </MovieSheet>
        </div>

        <p className="whitespace-pre-line leading-relaxed">{review.review_text}</p>

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
    </main>
  );
}
