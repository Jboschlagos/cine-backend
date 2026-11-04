import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import ReviewForm from "@/components/ReviewForm";

// /admin/editar/123 -> el formulario de reseña con los datos actuales, para corregir lo que sea
export default async function EditReviewPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [[review], images] = await Promise.all([
    sql`SELECT * FROM reviews WHERE id = ${id}`,
    sql`SELECT image_url FROM review_images WHERE review_id = ${id} ORDER BY position ASC`,
  ]);
  if (!review) notFound();

  return (
    <div>
      <p className="mx-auto max-w-3xl px-4 pt-4 text-sm text-neutral-500">
        <Link href={`/reviews/${review.id}`} className="underline">← Volver a la reseña</Link>
      </p>
      <ReviewForm
        existing={{
          id: review.id,
          tmdb_id: review.tmdb_id,
          media_type: review.media_type,
          title: review.title,
          release_year: review.release_year,
          review_text: review.review_text,
          soundtrack: review.soundtrack_embed_url ?? "",
          mood: review.mood,
          created_at: new Date(review.created_at).toISOString(),
          images: images.map((img) => img.image_url),
        }}
      />
    </div>
  );
}
