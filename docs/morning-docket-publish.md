# Morning Docket: daily case (UTC)

The app resolves “today’s” Morning Docket via [`resolveDailyCaseIdForUtcDate()`](../lib/dailyPolicy.ts) (and [`getUtcTodayDailyCaseId()`](../lib/dailyPolicy.ts) for callers that only need the id).

## Default: automatic rotation

If there is **no** [`DailyChallenge`](../prisma/schema.prisma) row for the UTC calendar date, the case is chosen **deterministically** from **all** catalog cases (`Case` rows, ordered by `id`):

- Days are indexed from **`DAILY_DOCKET_EPOCH`** (default `2026-01-01`; override with env).
- Within each block of **N** days (N = number of cases), every case appears **exactly once** (Fisher–Yates shuffle per block, seeded with **`DAILY_DOCKET_SECRET`** or [`AUTH_SECRET`](../.env.example) / `NEXTAUTH_SECRET`).
- The first request that needs that day **creates** the `DailyChallenge` row (race-safe). Later requests read the row.

Rotation logic lives in [`lib/dailyRotation.ts`](../lib/dailyRotation.ts).

### Env (optional)

| Variable | Purpose |
|----------|---------|
| `DAILY_DOCKET_EPOCH` | `YYYY-MM-DD` UTC anchor for the day index (default `2026-01-01`). |
| `DAILY_DOCKET_SECRET` | Seed for shuffle; if unset, uses `AUTH_SECRET` or `NEXTAUTH_SECRET`. **Required in production** if auth secrets are unset (throws at runtime). |

Importing a case with [`scripts/import-case.ts`](../scripts/import-case.ts) **does not** insert a `DailyChallenge` row; the new case joins the rotation automatically (N increases from the next resolution).

## Manual override

If a `DailyChallenge` row **already exists** for that UTC date, it **wins** over the auto algorithm. Use this to pin a specific case or fix a mistake.

Use [`scripts/set-daily-challenge.ts`](../scripts/set-daily-challenge.ts):

```bash
npx dotenv -e .env --override -- tsx scripts/set-daily-challenge.ts YYYY-MM-DD <caseId>
```

- **`YYYY-MM-DD`**: UTC date for the challenge (matches `utcChallengeDate()` in [`lib/careerTier.ts`](../lib/careerTier.ts)).
- **`caseId`**: The `Case.id` returned from import or from Prisma / the database.

Or with npm script:

```bash
npm run set-daily-challenge -- 2026-04-01 clxxxxxxxxxxxxxxxx
```

(`npm run` passes extra args after `--` to the underlying command.)

## Seed behavior

[`prisma/seed.ts`](../prisma/seed.ts) may create `DailyChallenge` rows for development. Those rows behave like manual overrides for the seeded dates; other dates still use auto rotation if no row exists.
