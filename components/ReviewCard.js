import Link from "next/link";
import { MOOD_LABELS } from "@/lib/mood";

export default function ReviewCard({ review }) {
  const thumbnail = review.images?.[0]?.image_url;

  return (
    <Link
      href={`/reviews/${review.id}`}
      className="group relative block aspect-[2/3] overflow-hidden bg-neutral-900"
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={review.title}
          className="h-full w-full object-cover transition group-hover:opacity-75"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-neutral-500">
          Sin imagen
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <p className="truncate text-sm font-medium text-white">{review.title}</p>
        <p className="text-xs text-neutral-300">{MOOD_LABELS[review.mood]}</p>
      </div>
    </Link>
  );
}
