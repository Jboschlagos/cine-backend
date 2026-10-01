import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { uploadImage } from "@/lib/cloudinary";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

// POST /api/upload  (solo admin)
// body: FormData con un campo "file" (imagen)
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string" || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Se requiere un archivo de imagen" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 4 MB" }, { status: 400 });
  }

  const url = await uploadImage(Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url }, { status: 201 });
}
