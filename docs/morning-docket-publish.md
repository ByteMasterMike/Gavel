# Morning Docket: assign the daily case (UTC)

The app resolves “today’s” Morning Docket via [`getUtcTodayDailyCaseId()`](../lib/dailyPolicy.ts), which reads a [`DailyChallenge`](../prisma/schema.prisma) row keyed by **UTC calendar date** (`date` @db.Date).

Importing a case with [`scripts/import-case.ts`](../scripts/import-case.ts) **does not** set the daily challenge automatically.

## Set or update the row

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

[`prisma/seed.ts`](../prisma/seed.ts) creates `DailyChallenge` rows for development. Production should set challenges explicitly or via a scheduled job that calls the same upsert logic.
