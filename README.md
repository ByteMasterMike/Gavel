# The Gavel (MVP)

Next.js full-stack MVP: **Briefing → Evidence → Law library → Ruling → Reveal & scoring** with Prisma (**PostgreSQL**), NextAuth (Google + dev credentials), and optional Anthropic scoring.

## Prerequisites

- Node 20+
- A **PostgreSQL** database. [Nhost](https://nhost.io/) (or any Postgres host) works well: use the connection URI as `DATABASE_URL`. If the provider expects TLS, include `?sslmode=require` (or the equivalent query params they document).

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Set `DATABASE_URL` to your Postgres URI, `AUTH_SECRET` (e.g. `openssl rand -base64 32`), and optionally `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `ANTHROPIC_API_KEY`.

3. Apply migrations and seed:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

   For local iteration without migration history, you can use `npm run db:push` instead of `migrate deploy` (not recommended for production).

4. Run the app:

   ```bash
   npm run dev
   ```

- **Development sign-in**: On the home page, use **Dev sign-in** (no Google keys required).
- **Google sign-in**: Configure OAuth credentials and add redirect URI `http://localhost:3000/api/auth/callback/google`.

### Deploying (e.g. Vercel + Nhost Postgres)

Set the same `DATABASE_URL` in the host’s environment (Vercel: Project → Settings → Environment Variables). Redeploy after changing secrets. Run `npx prisma migrate deploy` against the **production** database at least once so the schema exists before users hit the app.

## Scripts

| Command            | Description                |
| ------------------ | -------------------------- |
| `npm run dev`      | Start Next.js dev server   |
| `npm run build`    | Production build           |
| `npm run db:seed`  | Seed sample cases          |
| `npm run db:push`  | Sync schema to the database without using migration files (dev only) |
| `npm run db:reset-dev` | Delete `dev@thegavel.local` and rulings; sign in again for a clean dev account |
| `npx prisma migrate deploy` | Apply migrations (PostgreSQL workflows) |

## Project layout

- `app/case/[id]` — Gameplay shell (four in-flow phases; reveal on `app/results/[rulingId]`).
- `app/api/rulings` — Submit ruling; scores asynchronously then updates row to `SCORED`.
- `lib/scoring/*` — Accuracy, style, totals, judge rank.
- `lib/llm/evaluateReasoning.ts` — Claude reasoning score (falls back if no API key).
- `prisma/seed.ts` — Three **synthetic** sample cases (Tiers 1–3, one “overturned” civil scenario) for testing — not pulled from real court APIs.

## Legal

Educational simulation only — not legal advice. See in-app disclaimer on the reveal screen.
