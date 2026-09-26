# Backend — Página de reseñas de cine

Backend en Next.js (App Router) + PostgreSQL (Neon). Cubre: reseñas con datos
de TMDB, estado de ánimo inferido automáticamente, comentarios públicos sin
cuenta, y un login de admin para publicar reseñas.

## Setup

1. Instalar dependencias:
   ```
   npm install
   ```

2. Crear una base de datos en [Neon](https://neon.tech) y copiar la
   `DATABASE_URL`.

3. Crear una cuenta en [TMDB](https://www.themoviedb.org/settings/api) y
   copiar el **API Read Access Token**.

4. Copiar `.env.local.example` a `.env.local` y completar los valores
   (`DATABASE_URL`, `TMDB_API_READ_TOKEN`, y `BETTER_AUTH_SECRET` — generar
   con `npx @better-auth/cli@latest secret`).

5. Generar y aplicar las tablas de autenticación de Better Auth (user,
   session, account, verification):
   ```
   npx @better-auth/cli@latest generate
   npx @better-auth/cli@latest migrate
   ```
   Después, crear las tablas propias del sitio corriendo `db/schema.sql`
   contra tu base (con el editor SQL de Neon, o
   `psql $DATABASE_URL -f db/schema.sql`).

6. Crear tu usuario admin:
   ```
   node --env-file=.env.local db/create-admin.mjs tu@email.com tu_contraseña
   ```

7. Levantar el servidor:
   ```
   npm run dev
   ```

## Endpoints

| Método | Ruta                    | Protección | Descripción                                   |
| ------ | ----------------------- | ---------- | ---------------------------------------------- |
| GET    | `/api/reviews`          | Pública    | Lista reseñas (`?mood=xxx` filtra)            |
| GET    | `/api/reviews/:id`      | Pública    | Detalle de una reseña + sus comentarios       |
| POST   | `/api/reviews`          | Admin      | Crea una reseña (`tmdb_id`, `review_text`, `soundtrack_embed_url`) |
| PUT    | `/api/reviews/:id`      | Admin      | Edita una reseña                              |
| DELETE | `/api/reviews/:id`      | Admin      | Borra una reseña                              |
| POST   | `/api/comments`         | Pública    | Crea un comentario (`review_id`, `name`, `text`) |
| GET    | `/api/movies/search`    | Admin      | Busca películas en TMDB (`?q=titulo`)         |
| *      | `/api/auth/[...all]`    | —          | Login/logout (Better Auth)                     |

El mood de cada reseña se calcula solo, a partir de los géneros (y algunas
keywords) que devuelve TMDB — ver `lib/mood.js` si querés ajustar el mapeo.

## Todavía falta (frontend)

- `app/page.js` — home con el feed/grid
- `app/reviews/[id]/page.js` — detalle de una reseña
- `app/admin/` — login + formulario de carga
- Componentes: tarjeta de reseña, filtro de mood, reproductor de soundtrack, formulario de comentarios

Lo armamos en el próximo paso.
