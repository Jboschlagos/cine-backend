import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// POST /api/comments  (público, sin login)
// body: { review_id, name, text }
export async function POST(request) {
  const body = await request.json();
  const { review_id, name, text } = body;

  if (!review_id || !name?.trim() || !text?.trim()) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: review_id, name, text" },
      { status: 400 }
    );
  }

  // límites simples para evitar abuso desde el formulario público
  if (name.length > 80 || text.length > 2000) {
    return NextResponse.json(
      { error: "El nombre o el comentario superan el largo permitido" },
      { status: 400 }
    );
  }

  const rows = await sql`
    INSERT INTO comments (review_id, name, text)
    VALUES (${review_id}, ${name.trim()}, ${text.trim()})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
