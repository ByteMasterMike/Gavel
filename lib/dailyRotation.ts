/**
 * Deterministic Morning Docket rotation: each UTC calendar day maps to one case,
 * shuffled in blocks of N (no repeats within a block). See docs/morning-docket-publish.md.
 */

export const DEFAULT_DAILY_DOCKET_EPOCH_YMD = "2026-01-01";

function parseUtcYmdToUtcNoon(ymd: string): number {
  const [y, mo, d] = ymd.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    throw new Error(`Invalid YYYY-MM-DD: ${ymd}`);
  }
  return Date.UTC(y, mo - 1, d, 12, 0, 0, 0);
}

/** Whole UTC calendar days from `epochYmd` (inclusive anchor) to `ymd`. */
export function utcDayIndexSinceEpoch(ymd: string, epochYmd: string): number {
  const a = parseUtcYmdToUtcNoon(ymd);
  const b = parseUtcYmdToUtcNoon(epochYmd);
  return Math.round((a - b) / 86_400_000);
}

export function formatUtcDateYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** UTC midnight for the same calendar day as `d` (for Prisma @db.Date). */
export function utcCalendarDateOnly(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function fnv1a32(input: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Fisher–Yates shuffle with a deterministic RNG keyed by `seedKey`. */
export function seededShuffle<T>(items: readonly T[], seedKey: string): T[] {
  const arr = [...items];
  const rand = mulberry32(fnv1a32(seedKey));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getDailyRotationSecret(): string {
  const s =
    process.env.DAILY_DOCKET_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Set DAILY_DOCKET_SECRET or AUTH_SECRET so Morning Docket rotation is stable across instances.",
    );
  }
  return "dev-daily-docket-placeholder";
}

export function getDailyRotationEpochYmd(): string {
  const raw = process.env.DAILY_DOCKET_EPOCH?.trim();
  if (!raw) return DEFAULT_DAILY_DOCKET_EPOCH_YMD;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`DAILY_DOCKET_EPOCH must be YYYY-MM-DD, got: ${raw}`);
  }
  return raw;
}

/**
 * Picks the auto-assigned case id for a UTC calendar day.
 * `allCaseIds` must be sorted deterministically (e.g. ascending id) before calling.
 */
export function computeAutoDailyCaseIdForDate(
  utcDate: Date,
  sortedCaseIds: string[],
  secret: string,
  epochYmd: string,
): string | null {
  if (sortedCaseIds.length === 0) return null;
  const ymd = formatUtcDateYmd(utcCalendarDateOnly(utcDate));
  const dayIndex = utcDayIndexSinceEpoch(ymd, epochYmd);
  const n = sortedCaseIds.length;
  const block = Math.floor(dayIndex / n);
  const offset = ((dayIndex % n) + n) % n;
  const perm = seededShuffle(sortedCaseIds, `${secret}:dailyBlock:${block}`);
  return perm[offset] ?? null;
}
