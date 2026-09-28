export default function DiscoverCard({ movie }) {
  return (
    <div className="relative aspect-[2/3] overflow-hidden bg-neutral-900">
      {movie.poster_url ? (
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-neutral-500">
          Sin afiche
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <p className="truncate text-sm font-medium text-white">{movie.title}</p>
        <p className="text-xs text-neutral-300">{movie.release_year}</p>
      </div>
    </div>
  );
}
