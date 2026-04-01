/**
 * Import a validated `case-import.json` into Postgres.
 *
 * Usage (from repo root, with DATABASE_URL in .env):
 *   npx dotenv -e .env --override -- tsx scripts/import-case.ts path/to/case-import.json
 */
import { readFileSync } from "node:fs";
import { parseCaseImportJson } from "../lib/caseImport/schema";
import { caseImportToPrismaCreate } from "../lib/caseImport/toPrisma";
import { prisma } from "../lib/prisma";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: tsx scripts/import-case.ts <case-import.json>");
    process.exit(1);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (e) {
    console.error("Could not read or parse JSON file:", e);
    process.exit(1);
  }

  const data = parseCaseImportJson(raw);
  const created = await prisma.case.create({
    data: caseImportToPrismaCreate(data),
  });

  console.log(`Imported case: ${created.id}`);
  console.log(`Title: ${created.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
