// Reglas para las imágenes de una reseña (las usan crear y editar).
const ALLOWED_IMAGE_HOSTS = ["image.tmdb.org", "res.cloudinary.com"];
export const MAX_IMAGES = 10;

// Medidas de la vista previa al compartir (WhatsApp, Facebook, etc.).
export const SHARE_IMAGE = { width: 1200, height: 630 };

// Convierte una imagen de la reseña en una apta para compartir:
// - Cloudinary: le pedimos una versión jpg de 1200x630 con el afiche completo
//   y franjas negras a los lados (c_pad,b_black). WhatsApp a veces no muestra .webp.
// - TMDB: ya son .jpg; pedimos el tamaño w780 en vez del original (que puede pesar varios MB).
// Devuelve { url, width, height } (width/height solo cuando los conocemos).
export function toShareImage(imageUrl) {
  if (imageUrl.includes("res.cloudinary.com/") && imageUrl.includes("/image/upload/")) {
    const { width, height } = SHARE_IMAGE;
    const url = imageUrl
      .replace("/image/upload/", `/image/upload/c_pad,b_black,w_${width},h_${height},f_jpg,q_auto/`)
      .replace(/\.(webp|png|jpe?g|avif|gif|heic)$/i, ".jpg");
    return { url, width, height };
  }
  if (imageUrl.includes("image.tmdb.org/t/p/")) {
    return { url: imageUrl.replace(/\/t\/p\/[^/]+\//, "/t/p/w780/") };
  }
  return { url: imageUrl };
}

// Solo aceptamos entre 1 y 10 URLs https de TMDB o Cloudinary.
export function validImages(images) {
  if (!Array.isArray(images) || images.length === 0 || images.length > MAX_IMAGES) return false;
  return images.every((u) => {
    try {
      const url = new URL(u);
      return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(url.hostname);
    } catch {
      return false;
    }
  });
}
