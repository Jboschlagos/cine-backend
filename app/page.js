import ReviewsIndex from "@/components/ReviewsIndex";

export default function HomePage({ searchParams }) {
  return (
    <ReviewsIndex
      searchParams={searchParams}
      mediaType="movie"
      basePath="/"
      heading="Lo que queda cuando se encienden las luces"
      intro="Reseñas, afiches y bandas sonoras de películas que me movieron algo."
    />
  );
}
