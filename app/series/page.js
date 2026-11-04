import ReviewsIndex from "@/components/ReviewsIndex";

export const metadata = { title: "Series" };

export default function SeriesPage({ searchParams }) {
  return (
    <ReviewsIndex
      searchParams={searchParams}
      mediaType="tv"
      basePath="/series"
      heading="Series"
      intro="Las series que me acompañaron, temporada tras temporada."
    />
  );
}
