# The Gavel (MVP)

Next.js full-stack MVP: **Briefing → Evidence → Law library → Ruling → Reveal & scoring** with Prisma (SQLite locally by default), NextAuth (Google + dev credentials), and optional Anthropic scoring.

## Prerequisites

- Node 20+
- Default local DB is **SQLite** (`prisma/dev.db` via `DATABASE_URL=file:./dev.db`). Optional: PostgreSQL + `docker-compose.yml` if you switch the Prisma provider.

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Set `DATABASE_URL`, `AUTH_SECRET` (e.g. `openssl rand -base64 32`), and optionally `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `ANTHROPIC_API_KEY`.

3. Apply schema and seed:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

- **Development sign-in**: On the home page, use **Dev sign-in** (no Google keys required).
- **Google sign-in**: Configure OAuth credentials and add redirect URI `http://localhost:3000/api/auth/callback/google`.

## Scripts

| Command            | Description                |
| ------------------ | -------------------------- |
| `npm run dev`      | Start Next.js dev server   |
| `npm run build`    | Production build           |
| `npm run db:seed`  | Seed sample cases          |
| `npm run db:push`  | Sync schema to SQLite (local) |
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
