import Link from "next/link";
import { MOOD_LABELS } from "@/lib/mood";
import PosterFace, { POSTER_CARD_CLASS } from "@/components/PosterFace";

export default function ReviewCard({ review }) {
  const thumbnail = review.images?.[0]?.image_url ?? review.poster_url;

  return (
    <Link href={`/reviews/${review.id}`} className={POSTER_CARD_CLASS}>
      <PosterFace
        image={thumbnail}
        title={review.title}
        rows={[
          ["año", review.release_year],
          [review.media_type === "tv" ? "creada por" : "dir.", review.director],
          ["música", review.composer],
          ["mood", MOOD_LABELS[review.mood]],
        ]}
      />
    </Link>
  );
}
