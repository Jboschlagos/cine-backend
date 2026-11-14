// Script de un solo uso: completa los actores (columna reviews.actors) de las
// reseñas que ya existían, consultando el reparto en TMDB.
// Antes, corre la migración db/migrations/2026-11-14-actores.sql.
// Correr con: node --env-file=.env.local db/backfill-actors.mjs
// Se puede repetir: solo toca las reseñas que todavía no tienen actores.

import { neon } from "@neondatabase/serverless";

const MAX_ACTORS = 5; // igual que en lib/tmdb.js
const sql = neon(process.env.DATABASE_URL);

const reviews = await sql`
  SELECT id, tmdb_id, media_type, title FROM reviews
  WHERE actors IS NULL
  ORDER BY id
`;
console.log(`Reseñas sin actores: ${reviews.length}`);

let ok = 0;
for (const r of reviews) {
  const kind = r.media_type === "tv" ? "tv" : "movie";
  const res = await fetch(`https://api.themoviedb.org/3/${kind}/${r.tmdb_id}/credits?language=es-ES`, {
    headers: { Authorization: `Bearer ${process.env.TMDB_API_READ_TOKEN}`, accept: "application/json" },
  });
  if (!res.ok) {
    console.log(`  ✗ #${r.id} ${r.title}: TMDB respondió ${res.status}`);
    continue;
  }
  const { cast = [] } = await res.json();
  const actors = cast.slice(0, MAX_ACTORS).map((c) => c.name);
  // Lista vacía (no null) = "ya la revisamos y no tiene reparto": no se vuelve a consultar.
  await sql`UPDATE reviews SET actors = ${actors} WHERE id = ${r.id}`;
  console.log(`  ✓ #${r.id} ${r.title}: ${actors.join(", ") || "(sin reparto en TMDB)"}`);
  ok++;
}

console.log(`Listo: ${ok} de ${reviews.length} actualizadas.`);
