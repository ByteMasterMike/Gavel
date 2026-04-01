# Verifying case import

## Automated

- Schema unit tests: `npm run test` (covers [`lib/caseImport/schema.test.ts`](../lib/caseImport/schema.test.ts)).
- Optional: run import against the fixture (requires DB):

  ```bash
  npx dotenv -e .env --override -- tsx scripts/import-case.ts content/fixtures/case-import.minimal.json
  ```

  Expect a printed `Imported case: <cuid>`.

## Manual playtest (after import)

1. Start the app (`npm run dev`) with a valid `DATABASE_URL`.
2. Confirm the case appears in the catalog (tier / subscription gating may hide it — use a matching user tier or set `tier: 1`, `requiresSubscription: false`).
3. Play: briefing → evidence → library → ruling → submit.
4. Open results: verify scores, judge rank, and LLM feedback (if `GEMINI_API_KEY` is set).
5. **Overturned path**: import a case with `isOverturned: true` and appellate fields filled; confirm reveal / prescient copy on [`app/results/[rulingId]/page.tsx`](../app/results/[rulingId]/page.tsx).

## Admin API

With `ADMIN_IMPORT_SECRET` set:

```bash
curl -sS -X POST "$ORIGIN/api/admin/cases/import" \
  -H "Authorization: Bearer $ADMIN_IMPORT_SECRET" \
  -H "Content-Type: application/json" \
  -d @content/fixtures/case-import.minimal.json
```

Or use [`/admin/import`](../app/admin/import/page.tsx) in the browser (keep secret off-screen; restrict production access).
