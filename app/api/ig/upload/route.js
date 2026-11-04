import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { resolveImage } from "@/lib/instagram";
import { uploadImage } from "@/lib/cloudinary";

// POST /api/ig/upload  (solo admin)
// body: { path: "media/posts/123.webp" } -> sube ESA foto de la exportación a Cloudinary.
// Se usa al publicar: solo se suben las fotos que elegiste.
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { path } = await request.json().catch(() => ({}));
  const full = resolveImage(path);
  if (!full) return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });

  try {
    const url = await uploadImage(await readFile(full));
    return NextResponse.json({ url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo subir la foto a Cloudinary" }, { status: 502 });
  }
}
