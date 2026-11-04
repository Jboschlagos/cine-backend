import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

// PATCH /api/ig/posts/:id  (solo admin)
// body: { status: "descartado" | "pendiente" }  -> descartar o recuperar un post.
// Los publicados no se pueden cambiar desde acá.
export async function PATCH(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const { status } = await request.json().catch(() => ({}));
  if (!/^\d+$/.test(id) || !["descartado", "pendiente"].includes(status)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const rows = await sql`
    UPDATE ig_posts SET status = ${status}
    WHERE id = ${id} AND status <> 'publicado'
    RETURNING id, status
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "No existe o ya está publicado" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
