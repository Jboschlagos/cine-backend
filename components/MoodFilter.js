import Link from "next/link";
import { MOOD_LABELS } from "@/lib/mood";

export default function MoodFilter({ activeMood, basePath = "/" }) {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Link
        href={basePath}
        className={`rounded-full px-4 py-1.5 text-sm ${
          !activeMood ? "bg-white text-black" : "bg-neutral-800 text-white"
        }`}
      >
        Todas
      </Link>
      {Object.entries(MOOD_LABELS).map(([key, label]) => (
        <Link
          key={key}
          href={`${basePath}?mood=${key}`}
          className={`rounded-full px-4 py-1.5 text-sm ${
            activeMood === key ? "bg-white text-black" : "bg-neutral-800 text-white"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
