/**
 * Daily docket policy: UTC date keys `DailyChallenge`; leaderboard uses viewer local calendar day.
 */
import { prisma } from "@/lib/prisma";
import { formatDateInUserTimeZone, utcChallengeDate } from "@/lib/careerTier";

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

/** Case id for today's UTC-keyed `DailyChallenge` row (global docket). */
export async function getUtcTodayDailyCaseId(): Promise<string | null> {
  const daily = await prisma.dailyChallenge.findUnique({
    where: { date: utcChallengeDate() },
    select: { caseId: true },
  });
  return daily?.caseId ?? null;
}

/**
 * True if `caseId` was a Morning Docket case on a **past** UTC day (not today's row).
 * Catalog cases never appear in `DailyChallenge` → false.
 */
export async function isExpiredPastDailyCase(caseId: string): Promise<boolean> {
  const today = utcChallengeDate();
  const todaysRow = await prisma.dailyChallenge.findUnique({
    where: { date: today },
    select: { caseId: true },
  });
  if (todaysRow?.caseId === caseId) return false;
  const historical = await prisma.dailyChallenge.findFirst({
    where: { caseId },
    select: { date: true },
  });
  return historical != null;
}
