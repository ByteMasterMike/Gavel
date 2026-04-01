# CourtListener → `source.md`

Use this workflow to capture raw opinion text before Claude turns it into [`case-import.json`](./case-import-claude-prompt.md).

## 1. Account and token

1. Create an account at [CourtListener](https://www.courtlistener.com/).
2. Open your profile and create an **API token**.
3. Send it on every request:

   ```http
   Authorization: Token YOUR_TOKEN_HERE
   ```

4. Respect [rate limits](https://www.courtlistener.com/help/api/rest/) and terms of use.

## 2. Find the opinion

Use the **search** endpoint to locate the cluster or opinion:

```http
GET https://www.courtlistener.com/api/rest/v4/search/?q=YOUR_QUERY&format=json
Authorization: Token YOUR_TOKEN_HERE
```

Review the JSON for **opinion** ids (and **cluster** ids if you need metadata). See [REST API help](https://www.courtlistener.com/help/api/rest/).

## 3. Fetch full opinion text

```http
GET https://www.courtlistener.com/api/rest/v4/opinions/{OPINION_ID}/?format=json
Authorization: Token YOUR_TOKEN_HERE
```

The response includes fields for the body of the opinion (e.g. plain text or HTML depending on record). Copy the full text from the appropriate fields into your local file.

## 4. Build `source.md`

Create a file named `source.md` (or one file per case in a folder):

1. **Header** — Record for traceability:
   - CourtListener opinion id(s)
   - Cluster id if used
   - Citation / case name / court / date (from API or your notes)
2. **Body** — Paste the opinion text (and any other notes you want Claude to see).

This file is **input to Claude**, not imported by the app directly.

## 5. Next step

Follow [case-import-claude-prompt.md](./case-import-claude-prompt.md) to produce `case-import.json`, then run [`scripts/import-case.ts`](../scripts/import-case.ts) or use the admin import API.
