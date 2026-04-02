/**
 * Daily docket policy: UTC date keys `DailyChallenge`; leaderboard uses viewer local calendar day.
 */
import { Prisma } from "@prisma/client";
import { formatDateInUserTimeZone, utcChallengeDate } from "@/lib/careerTier";
import {
  computeAutoDailyCaseIdForDate,
  getDailyRotationEpochYmd,
  getDailyRotationSecret,
  utcCalendarDateOnly,
} from "@/lib/dailyRotation";
import { prisma } from "@/lib/prisma";

export const DEFAULT_LEADERBOARD_TIMEZONE = "America/New_York";

/** YYYY-MM-DD in `timeZone` for instant `ref`. */
export function localCalendarDate(ref: Date, timeZone: string): string {
  return formatDateInUserTimeZone(ref, timeZone);
}

function isValidIanaTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function resolveLeaderboardTimeZone(preferred?: string | null): string {
  if (preferred && isValidIanaTimeZone(preferred)) return preferred;
  return DEFAULT_LEADERBOARD_TIMEZONE;
}

/**
 * UTC instants `[start, end)` for the local calendar day of `ref` in `timeZone`.
 */
export function localDayBounds(timeZone: string, ref: Date): { start: Date; end: Date } {
  const tz = resolveLeaderboardTimeZone(timeZone);
  const ymd = formatDateInUserTimeZone(ref, tz);
  const start = zonedMidnightUtc(tz, ymd);
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

/** First UTC instant where the local date in `timeZone` equals `ymd` (YYYY-MM-DD). */
function zonedMidnightUtc(timeZone: string, ymd: string): Date {
  const [y, mo, d] = ymd.split("-").map((x) => parseInt(x, 10));
  const pivot = Date.UTC(y, mo - 1, d, 12, 0, 0, 0);
  let best: Date | null = null;
  for (let ms = pivot - 36 * 3_600_000; ms <= pivot + 36 * 3_600_000; ms += 60_000) {
    const t = new Date(ms);
    if (formatDateInUserTimeZone(t, timeZone) !== ymd) continue;
    if (!best || t < best) best = t;
  }
  return best ?? new Date(pivot);
}

async function sortedCatalogCaseIds(): Promise<string[]> {
  const rows = await prisma.case.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return rows.map((r) => r.id);
}

function autoCaseIdForUtcDay(day: Date, sortedIds: string[]): string | null {
  return computeAutoDailyCaseIdForDate(
    day,
    sortedIds,
    getDailyRotationSecret(),
    getDailyRotationEpochYmd(),
  );
}

/**
 * Morning Docket case id for a UTC calendar day without persisting an auto row.
 * Use for read-heavy paths (e.g. expired-daily checks).
 */
export async function peekDailyCaseIdForUtcDate(date: Date): Promise<string | null> {
  const day = utcCalendarDateOnly(date);
  const existing = await prisma.dailyChallenge.findUnique({
    where: { date: day },
    select: { caseId: true },
  });
  if (existing) return existing.caseId;
  const sortedIds = await sortedCatalogCaseIds();
  return autoCaseIdForUtcDay(day, sortedIds);
}

/**
 * Resolves the Morning Docket case for a UTC calendar day: existing `DailyChallenge` row wins;
 * otherwise computes rotation, persists it, and returns the case id.
 */
export async function resolveDailyCaseIdForUtcDate(date: Date): Promise<string | null> {
  const day = utcCalendarDateOnly(date);
  const existing = await prisma.dailyChallenge.findUnique({
    where: { date: day },
    select: { caseId: true },
  });
  if (existing) return existing.caseId;

  const sortedIds = await sortedCatalogCaseIds();
  const caseId = autoCaseIdForUtcDay(day, sortedIds);
  if (!caseId) return null;

  try {
    await prisma.dailyChallenge.create({
      data: { date: day, caseId },
    });
    return caseId;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const row = await prisma.dailyChallenge.findUnique({
        where: { date: day },
        select: { caseId: true },
      });
      return row?.caseId ?? caseId;
    }
    throw e;
  }
}

/** Case id for today's UTC-keyed Morning Docket (manual row or auto rotation). */
export async function getUtcTodayDailyCaseId(): Promise<string | null> {
  return resolveDailyCaseIdForUtcDate(utcChallengeDate());
}

/**
 * True if `caseId` was a Morning Docket case on a **past** UTC day (not today's row).
 * Catalog cases never appear in `DailyChallenge` → false.
 */
export async function isExpiredPastDailyCase(caseId: string): Promise<boolean> {
  const today = utcChallengeDate();
  const todaysCaseId = await peekDailyCaseIdForUtcDate(today);
  if (todaysCaseId === caseId) return false;
  const historical = await prisma.dailyChallenge.findFirst({
    where: { caseId, date: { lt: today } },
    select: { date: true },
  });
  return historical != null;
}
