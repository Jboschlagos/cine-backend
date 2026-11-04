import Link from "next/link";
import { sql } from "@/lib/db";
import IgImportList from "@/components/IgImportList";

const TABS = { pendiente: "Pendientes", publicado: "Publicados", descartado: "Descartados" };

// /admin/importar?estado=pendiente  -> lista de posts de Instagram por revisar
export default async function ImportPage({ searchParams }) {
  const { estado } = await searchParams;
  const status = TABS[estado] ? estado : "pendiente";

  const [posts, counts] = await Promise.all([
    sql`
      SELECT id, posted_at, title_guess, year_guess, series_guess, images[1] AS cover,
             cardinality(images) AS n_images, left(caption, 160) AS snippet, review_id
      FROM ig_posts WHERE status = ${status}
      ORDER BY posted_at DESC
    `,
    sql`SELECT status, count(*)::int AS n FROM ig_posts GROUP BY status`,
  ]);
  const count = Object.fromEntries(counts.map((c) => [c.status, c.n]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <h1 className="text-xl font-medium">Importar de Instagram</h1>
      <nav className="flex gap-4 text-sm">
        {Object.entries(TABS).map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/importar?estado=${key}`}
            className={key === status ? "text-white underline" : "text-neutral-500 hover:text-white"}
          >
            {label} ({count[key] ?? 0})
          </Link>
        ))}
      </nav>
      <IgImportList posts={posts} status={status} isEmpty={Object.keys(count).length === 0} />
    </div>
  );
}
