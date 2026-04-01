/**
 * Point the Morning Docket (UTC-keyed DailyChallenge) at a case by id.
 *
 * Usage:
 *   npx dotenv -e .env --override -- tsx scripts/set-daily-challenge.ts YYYY-MM-DD <caseId>
 *
 * Example:
 *   npx dotenv -e .env --override -- tsx scripts/set-daily-challenge.ts 2026-04-01 clxxxxxxxx
 */
import { prisma } from "../lib/prisma";

function parseUtcDateOnly(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) throw new Error(`Invalid date "${ymd}" — use YYYY-MM-DD`);
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
  if (Number.isNaN(dt.getTime())) throw new Error(`Invalid calendar date "${ymd}"`);
  return dt;
}

async function main() {
  const ymd = process.argv[2];
  const caseId = process.argv[3];
  if (!ymd || !caseId) {
    console.error("Usage: tsx scripts/set-daily-challenge.ts YYYY-MM-DD <caseId>");
    process.exit(1);
  }

  const date = parseUtcDateOnly(ymd);
  const c = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true, title: true } });
  if (!c) {
    console.error(`No case with id: ${caseId}`);
    process.exit(1);
  }

  await prisma.dailyChallenge.upsert({
    where: { date },
    create: { date, caseId },
    update: { caseId },
  });

  console.log(`DailyChallenge ${ymd} (UTC) → ${caseId} (${c.title})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
