// Datos generales del sitio: si cambias un link, cámbialo solo aquí.
export const SITE = {
  name: "Reducido",
  tagline: "reseñas por diversión",
  url: "https://reducidoresenas.vercel.app",
  description: "Reseñas, afiches y bandas sonoras. Un experimento.",
  instagram: "https://www.instagram.com/jboschlagos/",
  github: "https://github.com/Jboschlagos",
  linkedin: "https://www.linkedin.com/in/jboschlagos/",
};

// Datos de Open Graph que se repiten en todas las páginas. Hace falta repetirlos
// porque si una página define su propio openGraph, Next reemplaza el del layout entero.
export const OPEN_GRAPH_BASE = {
  siteName: SITE.name,
  locale: "es_CL",
};
