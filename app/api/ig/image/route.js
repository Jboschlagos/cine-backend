import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/requireAdmin";
import { resolveImage } from "@/lib/instagram";

const TYPES = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

// GET /api/ig/image?path=media/posts/123.webp  (solo admin)
// Muestra una foto de la exportación de IG (para elegir cuáles subir).
export async function GET(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const full = resolveImage(new URL(request.url).searchParams.get("path"));
  if (!full) return new Response("Ruta inválida", { status: 400 });

  try {
    const file = await readFile(full);
    return new Response(file, {
      headers: {
        "Content-Type": TYPES[path.extname(full).toLowerCase()],
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new Response("No encontrada", { status: 404 });
  }
}
