import { readFile } from "node:fs/promises";
import path from "node:path";

// Lee la exportación oficial de Instagram (formato JSON) desde tu PC.
// IG_EXPORT_DIR (en .env.local) = la carpeta donde descomprimiste los ZIP,
// la que tiene adentro "media" y "your_instagram_activity".

const IMAGE_EXT = [".webp", ".jpg", ".jpeg", ".png"];

export function exportDir() {
  const dir = process.env.IG_EXPORT_DIR;
  if (!dir) throw new Error("Falta IG_EXPORT_DIR en .env.local");
  return path.resolve(dir);
}

// Instagram guarda los textos con los acentos rotos ("pelÃ­cula" en vez de "película"):
// cada byte UTF-8 viene como si fuera una letra latin1. Esto lo arregla.
export function fixText(s) {
  if (!s) return "";
  try {
    return Buffer.from(s, "latin1").toString("utf8");
  } catch {
    return s;
  }
}

// "🎬 When Harry Met Sally… (Cuando Harry conoció a Sally, 1989)"
//   -> { title: "When Harry Met Sally…", altTitle: "Cuando Harry conoció a Sally", year: 1989, range: false }
// "🎬 Ted Lasso (2020–2023)" -> { title: "Ted Lasso", year: 2020, range: true }
// "🎬 Untamed Heart"          -> { title: "Untamed Heart", year: null }
export function parseTitleLine(line) {
  // saca 🎬 y símbolos del inicio, y ✨ o similares del final
  const clean = line.replace(/^[^\p{L}\p{N}]+/u, "").replace(/[^\p{L}\p{N})…!?.]+$/u, "").trim();
  // "A History of Violence, 2005" -> igual que "A History of Violence (2005)"
  const comma = clean.match(/^(.+?),\s*((18|19|20)\d{2})$/);
  if (comma) return { title: comma[1].trim(), altTitle: null, year: Number(comma[2]), range: false };
  // El paréntesis con el año; puede venir otro después, ej. "Hamnet (2025) (Hamnet)"
  const m = clean.match(/^(.+?)\s*\(([^()]*\d{4}[^()]*)\)(?:\s*\([^()]*\))?$/) ?? clean.match(/^(.+?)\s*\(([^()]*)\)$/);
  if (!m) return { title: clean || null, altTitle: null, year: null, range: false };

  const [, title, inside] = m;
  const years = inside.match(/\b(18|19|20)\d{2}\b/g) ?? [];
  const range = /\d{4}\s*[–—-]\s*(\d{4}|presente|actualidad)?/i.test(inside) && !/,\s*\d{4}\s*$/.test(inside);
  // Lo que queda entre paréntesis sin el año = título en español (si hay)
  const alt = inside.replace(/,?\s*\b(18|19|20)\d{2}\b.*$/, "").trim();
  return {
    title: title.trim(),
    altTitle: alt && !/^\d/.test(alt) ? alt : null,
    year: years.length ? Number(years[0]) : null,
    range: years.length > 0 && range,
  };
}

// Texto de la reseña: el post sin la 1.ª línea (el título) ni los #hashtags del final.
export function captionToReview(caption) {
  const lines = caption.split("\n");
  const first = lines[0] ?? "";
  // Solo sacamos la 1.ª línea si parece un título (corta o con año entre paréntesis)
  const body = first.length < 120 && (/\(\D*\d{4}/.test(first) || /^\W*🎬/u.test(first)) ? lines.slice(1) : lines;
  while (body.length && /^\s*(#\S+\s*)*\s*\.?\s*$/.test(body[body.length - 1])) body.pop();
  return body.join("\n").trim();
}

// Lee posts_1.json y devuelve los posts listos para guardar en ig_posts.
export async function readExportPosts() {
  const file = path.join(exportDir(), "your_instagram_activity", "media", "posts_1.json");
  const raw = JSON.parse(await readFile(file, "utf8"));

  return raw
    .map((p) => {
      const media = p.media ?? [];
      const caption = fixText(p.title ?? media[0]?.title ?? "");
      const firstLine = caption.trim().split("\n")[0] ?? "";
      const t = parseTitleLine(firstLine.length <= 150 ? firstLine : "");
      const ts = p.creation_timestamp ?? media[0]?.creation_timestamp;
      return {
        ig_key: media[0]?.uri ?? `sin-fotos-${ts}`,
        posted_at: new Date(ts * 1000).toISOString(),
        caption,
        title_guess: t.title,
        alt_title: t.altTitle,
        year_guess: t.year,
        // Serie si el año es un rango (2020–2023) o el inicio del texto habla de temporadas
        series_guess: t.range || /\b(miniserie|serie de televisión|temporadas?)\b/i.test(caption.slice(0, 400)),
        images: media.map((m) => m.uri).filter((u) => IMAGE_EXT.includes(path.extname(u).toLowerCase())),
      };
    })
    .filter((p) => p.posted_at);
}

// Ruta absoluta y SEGURA de una foto de la exportación (no deja salir de la carpeta media/).
export function resolveImage(relPath) {
  if (typeof relPath !== "string" || !IMAGE_EXT.includes(path.extname(relPath).toLowerCase())) return null;
  const base = path.join(exportDir(), "media");
  const full = path.resolve(exportDir(), relPath);
  return full.startsWith(base + path.sep) ? full : null;
}
