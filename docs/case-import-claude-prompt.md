# Claude prompt: `source.md` → `case-import.json`

Use after you have a [`source.md`](./courtlistener-source.md) (opinion text + metadata). Paste the prompt below into Claude with your file attached.

---

## System / instructions (copy-paste)

You are preparing structured game content for **The Gavel**, a legal education simulator. The database expects **exactly one JSON object** — no markdown fences, no commentary — matching the shape of [`content/case-import.template.json`](../content/case-import.template.json).

### Rules

1. **`briefSummary`**: Player-facing overview. **Do not** spoil the final outcome if the design calls for a blind briefing; summarize facts and procedure only, as the template comment describes.
2. **`actualOpinionExcerpt`**, **`correctVerdict`**, **`correctSentenceText`**, **`correctReasoningSummary`**: Ground truth for scoring — must match the real decision you are using.
3. **`documents`**: Evidence-locker items — each needs `title`, `content`, `sortOrder` (0-based order), `isAdmissible`, `isMaterial` (material = used for efficiency scoring; tag only docs that were necessary to the real ruling).
4. **`precedents`**: Mix **relevant** (`isRelevant: true`, higher `weightMultiplier` for foundational holdings) and **decoys** (`isRelevant: false`). Respect **`maxPrecedents`** as the maximum number of precedents the player may cite in-game (typically 3–7).
5. **`kind`**: Must be exactly `"CRIMINAL"` or `"CIVIL"` (uppercase).
6. **`tier`**: Integer 1–5 (difficulty / length).
7. **Overturned cases**: If the trial outcome was later reversed, set `isOverturned` to `true` and fill `appellateReversalSummary` and, when applicable, `appellateCorrectVerdict` / `appellateCorrectSentenceNumeric`.

Output **only valid JSON** that passes the same fields as the template. Omit keys that are null if you prefer — optional fields may be omitted when unused.

### User message template

Attach `source.md`, then write:

```text
Attached is source.md for one case. Produce case-import.json per your instructions. Output only the JSON object.
```

---

## Validation checklist (before import)

- [ ] JSON parses with `JSON.parse`.
- [ ] `kind` is `CRIMINAL` or `CIVIL`.
- [ ] At least one `documents` entry and one `precedents` entry.
- [ ] `maxPrecedents` ≥ number of precedents you expect players to select (and matches game design).
- [ ] Legal review: verdict, sentence, and material tags are correct.

Then run:

```bash
npx dotenv -e .env --override -- tsx scripts/import-case.ts path/to/case-import.json
```

Or use the **Admin import** UI at `/admin/import` (see [.env.example](../.env.example) for `ADMIN_IMPORT_SECRET`).
