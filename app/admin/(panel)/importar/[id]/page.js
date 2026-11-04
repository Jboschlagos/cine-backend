import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { captionToReview } from "@/lib/instagram";
import ReviewForm from "@/components/ReviewForm";

// /admin/importar/123 -> el formulario de reseña, precargado con el post de IG
export default async function ImportPostPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [post] = await sql`SELECT * FROM ig_posts WHERE id = ${id}`;
  if (!post) notFound();

  if (post.status !== "pendiente") {
    return (
      <p className="p-4 text-sm text-neutral-400">
        Este post ya está {post.status}.{" "}
        <Link href="/admin/importar" className="underline">Volver a la lista</Link>
      </p>
    );
  }

  return (
    <div>
      <p className="mx-auto max-w-3xl px-4 pt-4 text-sm text-neutral-500">
        Post del {new Date(post.posted_at).toLocaleDateString("es-CL")} ·{" "}
        <Link href="/admin/importar" className="underline">volver a la lista</Link>
      </p>
      <ReviewForm
        prefill={{
          igPostId: post.id,
          title: post.title_guess ?? "",
          altTitle: post.alt_title,
          year: post.year_guess,
          isSeries: post.series_guess,
          text: captionToReview(post.caption),
          images: post.images,
        }}
      />
    </div>
  );
}
