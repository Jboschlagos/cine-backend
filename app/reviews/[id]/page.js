import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { MOOD_LABELS } from "@/lib/mood";
import { toEmbedUrl } from "@/lib/embed";
import ImageCarousel from "@/components/ImageCarousel";
import CommentForm from "@/components/CommentForm";

// Página pública de una reseña: /reviews/123
export default async function ReviewPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound(); // si el id no es un número -> 404

  // Las 3 consultas van en paralelo para que cargue más rápido.
  const [reviewRows, images, comments] = await Promise.all([
    sql`SELECT * FROM reviews WHERE id = ${id}`,
    sql`SELECT image_url FROM review_images WHERE review_id = ${id} ORDER BY position ASC`,
    sql`SELECT * FROM comments WHERE review_id = ${id} ORDER BY created_at ASC`,
  ]);

  const review = reviewRows[0];
  if (!review) notFound();

  // Si no hay imágenes guardadas, usamos el afiche de TMDB como respaldo.
  const imageUrls =
    images.length > 0
      ? images.map((img) => img.image_url)
      : review.poster_url
        ? [review.poster_url]
        : [];

  const embedUrl = toEmbedUrl(review.soundtrack_embed_url);
  const isSpotify = embedUrl?.includes("spotify.com");

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-2">
      <ImageCarousel images={imageUrls} alt={review.title} />

      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-medium">
            {review.title}{" "}
            {review.release_year && (
              <span className="text-neutral-400">({review.release_year})</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {MOOD_LABELS[review.mood]}
            {review.genres?.length > 0 && ` · ${review.genres.join(", ")}`}
          </p>
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
                  <span className="text-neutral-500">
                    · {new Date(c.created_at).toLocaleDateString("es-CL")}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-300">{c.text}</p>
              </li>
            ))}
          </ul>
          <CommentForm reviewId={review.id} />
        </div>
      </section>
    </main>
  );
}
