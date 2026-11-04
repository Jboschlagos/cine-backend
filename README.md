# Lo que queda cuando se encienden las luces

> **EN —** A personal film & TV review site built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4** and **PostgreSQL (Neon)**. It shows my own reviews with posters and soundtracks, lets visitors discover new movies through a "mood sentence" filter powered by the TMDB API, and includes an admin panel to write, edit and **import reviews from an Instagram data export**. Built by a former furniture maker turned full-stack developer.

Página personal de reseñas de cine y series: afiches, bandas sonoras y textos de películas que me movieron algo. Nació de mi perfil de Instagram de reseñas y hoy tiene su propia casa.

<!-- CAPTURA: portada de Reseñas → guardar en docs/resenas.png -->
![Reseñas](docs/resenas.png)

## Qué hace

**Para quien visita**

- **Reseñas y Series**: grillas de afiches en blanco y negro que toman color al pasar el mouse y muestran una mini ficha (año, director o creadores, compositor, mood).
- **Filtros como una frase**: *"Hoy quiero algo [para llorar ▾] [chileno ▾] [de los 80 ▾] [cortito ▾]"*, más un buscador por título, orden (recientes, año, título), contador y botón "Ver más". Los filtros viven en la URL, así que cualquier búsqueda se puede compartir.
- **Filtro "con banda sonora"** para ver solo las reseñas que traen su música.
- **Descubrir**: películas de TMDB con los mismos filtros más "dónde verla" (Netflix, Prime, Disney+, Max o MUBI en Chile). Cada visita muestra una selección al azar, para no ver siempre los mismos taquillazos. También tiene buscador.
- **Ficha técnica** en ventana emergente: sinopsis, reparto, tráiler, carrusel de afiches, dónde verla en Chile y la banda sonora (canciones desde MusicBrainz y un link a Spotify).
- **Página de cada reseña** con carrusel de fotos, reproductor de Spotify o YouTube y comentarios sin necesidad de crear una cuenta.
- Reproductor de bandas sonoras al azar, página "Sobre mí" y formulario de contacto.

<!-- CAPTURA: Descubrir con filtros activos → docs/descubrir.png -->
![Descubrir](docs/descubrir.png)

<!-- CAPTURA: ficha técnica abierta → docs/ficha.png -->
![Ficha técnica](docs/ficha.png)

**Para mí (panel admin)**

- **Nueva reseña** en 3 pasos: buscar la película o serie en TMDB, elegir afiches o subir fotos propias (a Cloudinary) y escribir la reseña. El mood se calcula solo a partir de los géneros y las keywords.
- **Importar de Instagram**: lee la exportación oficial de IG (JSON), detecta el título y el año en cada post, arregla los acentos rotos y deja cada post listo para revisar. En la revisión se elige la película, hasta 10 fotos (solo esas se suben a Cloudinary) y se publica con la fecha original del post. Los posts que no son reseñas se descartan con un clic.
- **Editar y borrar** desde la misma página de la reseña (solo con la sesión iniciada): texto, banda sonora, mood, fecha, fotos y su orden, e incluso la película.

<!-- CAPTURA: pantalla Importar de IG → docs/importar.png -->
![Importar de Instagram](docs/importar.png)

## Stack

| Parte | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components) + React 19 |
| Estilos | Tailwind CSS 4 |
| Base de datos | PostgreSQL en [Neon](https://neon.tech) (`@neondatabase/serverless`) |
| Autenticación | [Better Auth](https://www.better-auth.com) (email + contraseña, sin registro público) |
| Imágenes | [Cloudinary](https://cloudinary.com) |
| Datos de películas | [TMDB API](https://www.themoviedb.org) |
| Bandas sonoras | MusicBrainz + embeds de Spotify y YouTube |
| Carrusel | Embla Carousel |

## Estructura

```
app/
  page.js                 Reseñas (portada)
  series/                 Series
  discover/               Descubrir (TMDB)
  reviews/[id]/           Página de una reseña
  admin/(panel)/          Panel: nueva reseña, importar de IG, editar
  api/                    Endpoints (ver tabla abajo)
components/               Tarjetas, filtros, ficha técnica, formulario de reseña...
lib/
  filters.js              Todos los filtros del sitio en un solo lugar
  mood.js                 Géneros/keywords de TMDB → mood
  tmdb.js                 Cliente de TMDB (películas y series)
  reviews.js              Consulta de reseñas (filtros, búsqueda, orden, páginas)
  instagram.js            Lectura de la exportación de Instagram
db/
  schema.sql              Tablas del sitio
  migrations/             Cambios posteriores al esquema
```

## Instalación

1. Instala las dependencias:
   ```
   npm install
   ```
2. Crea las cuentas y copia sus claves:
   - [Neon](https://neon.tech): la `DATABASE_URL`.
   - [TMDB](https://www.themoviedb.org/settings/api): el **API Read Access Token** (no la API Key clásica).
   - [Cloudinary](https://cloudinary.com): cloud name, API key y API secret.
3. Copia `.env.local.example` a `.env.local` y completa los valores. `BETTER_AUTH_SECRET` se genera con:
   ```
   npx @better-auth/cli@latest secret
   ```
4. Crea las tablas de autenticación (user, session, account, verification):
   ```
   npx @better-auth/cli@latest generate
   npx @better-auth/cli@latest migrate
   ```
5. Crea las tablas del sitio: en el editor SQL de Neon pega y corre el **contenido** de `db/schema.sql` y después el de cada archivo de `db/migrations/`, en orden. (También se puede hacer con `psql "$DATABASE_URL" -f archivo.sql`).
6. Crea tu usuario admin:
   ```
   node --env-file=.env.local db/create-admin.mjs tu@email.com tu_contraseña
   ```
7. Levanta el servidor y entra a `http://localhost:3000` (el panel está en `/admin`):
   ```
   npm run dev
   ```

### Variables de entorno

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Conexión a Neon |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Sesiones del admin |
| `TMDB_API_READ_TOKEN` | Datos de películas y series |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Subida de fotos |
| `IG_EXPORT_DIR` | *(Opcional)* Carpeta de la exportación de Instagram, con `/`, por ejemplo `C:/Users/yo/Desktop/En Proceso` |

## Importar reseñas desde Instagram

1. En Instagram: **Configuración → Centro de cuentas → Tu información y permisos → Descargar tu información**, en formato **JSON**.
2. Descomprime todos los ZIP en una misma carpeta (debe tener adentro `media/` y `your_instagram_activity/`) y pon esa ruta en `IG_EXPORT_DIR`.
3. En `/admin/importar` aprieta **"Leer exportación de IG"**. Se puede repetir sin duplicar posts.
4. En cada post: **Revisar** (eliges la película o serie, las fotos y corriges el texto) o **Descartar**. El avance queda guardado en la base, así que puedes seguir otro día.

Las fotos se leen desde tu disco al publicar, así que la importación funciona con el sitio corriendo en tu PC (`npm run dev`).

## API

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/api/feed` | Pública | Reseñas con filtros, búsqueda, orden y página (`?mood=&origin=&era=&length=&q=&orden=&page=&tipo=serie`) |
| GET | `/api/reviews` | Pública | Lista simple de reseñas (`?mood=`) |
| GET | `/api/reviews/:id` | Pública | Una reseña con sus comentarios |
| POST | `/api/reviews` | Admin | Crea una reseña (`tmdb_id`, `media_type`, `review_text`, `soundtrack_embed_url`, `images`, `ig_post_id?`) |
| PUT | `/api/reviews/:id` | Admin | Edita cualquier campo (texto, banda sonora, mood, fecha, fotos, película) |
| DELETE | `/api/reviews/:id` | Admin | Borra la reseña (si venía de IG, el post vuelve a Pendientes) |
| POST | `/api/comments` | Pública | Comentario (`review_id`, `name`, `text`) |
| POST | `/api/contact` | Pública | Formulario de contacto |
| GET | `/api/discover` | Pública | "Ver más" de Descubrir (`?sort=&page=` + filtros, o `?q=&page=`) |
| GET | `/api/movies/:id/sheet` | Pública | Ficha técnica (`?type=tv` para series) |
| GET | `/api/soundtrack` | Pública | Banda sonora en MusicBrainz (`?title=&year=`) |
| GET | `/api/movies/search` | Admin | Busca en TMDB (`?q=&type=tv`) |
| GET | `/api/movies/:id/images` | Admin | Afiches de TMDB (`?type=tv`) |
| POST | `/api/upload` | Admin | Sube una imagen a Cloudinary |
| POST | `/api/ig/sync` | Admin | Lee la exportación de Instagram |
| PATCH | `/api/ig/posts/:id` | Admin | Descarta o recupera un post (`status`) |
| GET | `/api/ig/image` | Admin | Muestra una foto de la exportación (`?path=`) |
| POST | `/api/ig/upload` | Admin | Sube una foto de la exportación a Cloudinary |
| * | `/api/auth/[...all]` | — | Login y logout (Better Auth) |

## Problemas comunes

- **Una página nueva da 404 sin ningún error**: es el caché de desarrollo. Detén el servidor, borra la carpeta `.next` y vuelve a correr `npm run dev`.
- **El primer `npm run dev` tarda minutos**: Next avisa *"Slow filesystem detected"* cuando el disco es lento (externo/USB o con el antivirus revisando todo). Ayuda tener el proyecto en un disco interno o excluir la carpeta en Windows Defender.

## Créditos

Datos e imágenes de películas y series: [TMDB](https://www.themoviedb.org). Este producto usa la API de TMDB, pero no está respaldado ni certificado por TMDB. Información de "dónde verla" vía JustWatch (a través de TMDB). Listados de bandas sonoras: [MusicBrainz](https://musicbrainz.org).

Hecho por **Jorge**, carpintero mueblista durante 10 años y hoy desarrollador full-stack.
