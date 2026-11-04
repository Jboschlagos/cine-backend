import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { readExportPosts } from "@/lib/instagram";

// POST /api/ig/sync  (solo admin)
// Lee posts_1.json de la exportación y guarda en ig_posts los posts nuevos.
// Se puede apretar varias veces: los que ya están no se duplican ni se tocan.
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  let posts;
  try {
    posts = await readExportPosts();
  } catch (e) {
    return NextResponse.json(
      { error: `No se pudo leer la exportación: ${e.message}. Revisa IG_EXPORT_DIR en .env.local` },
      { status: 500 },
    );
  }

  // Todos de una vez: json_to_recordset convierte la lista en filas.
  const added = await sql`
    INSERT INTO ig_posts (ig_key, posted_at, caption, title_guess, alt_title, year_guess, series_guess, images)
    SELECT ig_key, posted_at, caption, title_guess, alt_title, year_guess, series_guess, images
    FROM json_to_recordset(${JSON.stringify(posts)}::json) AS x(
      ig_key text, posted_at timestamptz, caption text, title_guess text,
      alt_title text, year_guess int, series_guess boolean, images text[]
    )
    ON CONFLICT (ig_key) DO NOTHING
    RETURNING id
  `;
  return NextResponse.json({ added: added.length, total: posts.length });
}
