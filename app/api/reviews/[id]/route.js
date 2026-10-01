import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

// GET /api/reviews/:id -> detalle de una reseña (incluye sus comentarios)
export async function GET(_request, { params }) {
  const { id } = await params;

  const reviewRows = await sql`SELECT * FROM reviews WHERE id = ${id}`;
  if (reviewRows.length === 0) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const comments = await sql`
    SELECT * FROM comments WHERE review_id = ${id} ORDER BY created_at ASC
  `;

  return NextResponse.json({ ...reviewRows[0], comments });
}

// PUT /api/reviews/:id  (solo admin)
// body: cualquier subconjunto de { review_text, soundtrack_embed_url, mood }
export async function PUT(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const { review_text, soundtrack_embed_url, mood } = body;

  const rows = await sql`
    UPDATE reviews SET
      review_text = COALESCE(${review_text}, review_text),
      soundtrack_embed_url = COALESCE(${soundtrack_embed_url}, soundtrack_embed_url),
      mood = COALESCE(${mood}, mood)
    WHERE id = ${id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

// DELETE /api/reviews/:id  (solo admin)
export async function DELETE(_request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await sql`DELETE FROM reviews WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
