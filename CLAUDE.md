# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal film/TV review site ("Reducido") — Next.js 16 App Router, React 19, Tailwind CSS 4, PostgreSQL on Neon, Better Auth, Cloudinary, TMDB. Plain JavaScript (no TypeScript). The UI, code comments, URL params and DB values are in Spanish (Chilean); keep new code consistent with that. `README.md` has setup, env vars and the full API table.

## Commands

```
npm run dev      # dev server at http://localhost:3000 (admin panel at /admin)
npm run build
npm run lint     # eslint . — note: there is no eslint.config.* file yet
node --env-file=.env.local db/create-admin.mjs <email> <password>   # create the admin user
node --env-file=.env.local db/reset-password.mjs <email> <new_password>
```

There is no test suite. There is no `next.config.*`.

Schema changes are applied by hand: run `db/schema.sql`, then each file in `db/migrations/` in date order (Neon SQL editor or `psql "$DATABASE_URL" -f file.sql`). New migrations go in `db/migrations/YYYY-MM-DD-<name>.sql` and should be idempotent (`IF NOT EXISTS`, guarded constraints). Better Auth tables (user, session, account, verification) are managed separately via `npx @better-auth/cli@latest migrate`.

If a new page 404s in dev without errors, stop the server and delete `.next`.

## Architecture

**Two DB connections.** `lib/db.js` exports `sql` (Neon serverless tagged template) for the site's own tables (`reviews`, `review_images`, `comments`, `ig_posts`). `lib/auth.js` gives Better Auth its own `pg` Pool on the same `DATABASE_URL`. Always query with the `sql` tagged template (parameterized); optional filters are written as `(${x}::type IS NULL OR col = ${x})` — see `lib/reviews.js`.

**Auth.** Single admin, sign-up disabled. Write API handlers must start with:
```js
const denied = await requireAdmin(); if (denied) return denied;
```
(`lib/requireAdmin.js`). Admin pages live under `app/admin/(panel)/`, whose `layout.js` redirects to `/admin/login` without a session.

**Movies and series share one model.** `reviews.media_type` is `'movie'` or `'tv'`; `lib/tmdb.js` wraps both TMDB endpoints and normalizes field differences (title/name, release_date/first_air_date). Most functions take a `type`/`mediaType` argument defaulting to movie. Reseñas (`/`) and Series (`/series`) are the same query with a different `mediaType`.

**Filters ("Hoy quiero algo …").** `lib/filters.js` is the single source of truth for every filter: labels, option keys, and the data behind them (year ranges, country codes, runtime ranges, streaming provider aliases). Filters live in the URL query string (`mood`, `origin`, `era`, `length`, `where`, plus `q` and `orden`). `readFilters()` sanitizes params; then `toReviewFilters()` maps them for the DB (`lib/reviews.js#getReviews`) and `toDiscoverFilters()` maps them for TMDB discover. Quirk: in Reseñas the `musical` mood means "has a soundtrack embed", not the stored mood. Series omit the `length` filter. Server pages render the first page; `GET /api/feed` and `GET /api/discover` serve "Ver más" pagination with the same params.

**Mood.** Not entered by hand on create — `lib/mood.js#inferMood` derives it from TMDB genre IDs (separate map for TV-only genres) and keywords. Denormalized TMDB data (title, year, director, composer, countries, runtime) is copied into `reviews` at create time so listing/filtering never calls TMDB.

**Review writes.** `POST /api/reviews` and `PUT /api/reviews/[id]` validate images via `lib/reviewImages.js` (1–10 https URLs from `image.tmdb.org` or `res.cloudinary.com`; array order = carousel order, first = cover) and normalize soundtrack links to Spotify/YouTube embed URLs via `lib/embed.js`. Review + images are inserted in a single CTE query.

**Instagram import.** `lib/instagram.js` reads the official IG JSON export from the local folder `IG_EXPORT_DIR` (with `node:fs`), guesses title/year/series from the caption's first line and fixes broken accent encoding. `POST /api/ig/sync` upserts into `ig_posts` keyed by `ig_key` (re-runnable without duplicates). Publishing a review with `ig_post_id` uses the post's original date and marks it `publicado`; deleting that review sends the post back to `pendiente`. Because photos are read from local disk, import only works with the app running locally.

**Next 16 conventions.** Route handler and page `params`/`searchParams` are Promises — `const { id } = await params;`. `@/` is aliased to the project root (`jsconfig.json`).

Site-wide links/name are in `lib/site.js`.

## Working with the owner (Jorge)

- Always reply in Spanish (Chile). Explain code briefly and simply; never just paste it.
- Basic full-stack JS level: explain new concepts in one or two lines.
- Never assume: ask before any decision (libraries, structure, design, data).
- Work one file at a time. Show terminal commands for creating files/folders.
- Environment: Windows, Git Bash (MSYS2 UCRT64). Use bash commands, not PowerShell.
- Work on a feature branch, never directly on `main`.

## Product vision

- "Descubrir" is about finding films from a mood, not popularity. Avoid anything that feels like a "popular movies" list.
- Visitor comments: name + text, no account, published immediately (MVP).
- Visual style: "Créditos finales" (pure black, spaced uppercase, B/W posters that gain color on hover, mini tech-sheet on hover, fixed Spotify player with random soundtracks from a curated album list). Details will live in DESIGN.md.
EOFcat >> CLAUDE.md << 'EOF'

## Working with the owner (Jorge)

- Always reply in Spanish (Chile). Explain code briefly and simply; never just paste it.
- Basic full-stack JS level: explain new concepts in one or two lines.
- Never assume: ask before any decision (libraries, structure, design, data).
- Work one file at a time. Show terminal commands for creating files/folders.
- Environment: Windows, Git Bash (MSYS2 UCRT64). Use bash commands, not PowerShell.
- Work on a feature branch, never directly on `main`.

## Product vision

- "Descubrir" is about finding films from a mood, not popularity. Avoid anything that feels like a "popular movies" list.
- Visitor comments: name + text, no account, published immediately (MVP).
- Visual style: "Créditos finales" (pure black, spaced uppercase, B/W posters that gain color on hover, mini tech-sheet on hover, fixed Spotify player with random soundtracks from a curated album list). Details will live in DESIGN.md.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
