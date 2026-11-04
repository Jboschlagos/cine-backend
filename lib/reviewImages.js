// Reglas para las imágenes de una reseña (las usan crear y editar).
const ALLOWED_IMAGE_HOSTS = ["image.tmdb.org", "res.cloudinary.com"];
export const MAX_IMAGES = 10;

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
