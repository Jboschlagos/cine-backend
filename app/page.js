import { sql } from "@/lib/db";
import ReviewCard from "@/components/ReviewCard";
import MoodFilter from "@/components/MoodFilter";

export default async function HomePage({ searchParams }) {
  const { mood } = await searchParams;

  const reviews = mood
    ? await sql`SELECT * FROM reviews WHERE mood = ${mood} ORDER BY created_at DESC`
    : await sql`SELECT * FROM reviews ORDER BY created_at DESC`;

  let reviewsWithImages = reviews;
  if (reviews.length > 0) {
    const reviewIds = reviews.map((r) => r.id);
    const images = await sql`
      SELECT * FROM review_images
      WHERE review_id = ANY(${reviewIds})
      ORDER BY position ASC
    `;
    reviewsWithImages = reviews.map((review) => ({
      ...review,
      images: images.filter((img) => img.review_id === review.id),
    }));
  }

  return (
    <main>
      <MoodFilter activeMood={mood} basePath="/" />
      {reviewsWithImages.length === 0 ? (
        <p className="p-4 text-neutral-400">Todavía no hay reseñas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
          {reviewsWithImages.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </main>
  );
}
