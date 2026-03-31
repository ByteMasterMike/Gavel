import { verdictMatches } from "@/lib/scoring/accuracyScore";

/** PRD §8 — cumulative career points required to sit at each tier (tier 1 = index 0). */
export const TIER_POINT_FLOORS = [0, 10_000, 40_000, 120_000, 350_000] as const;

/** PRD §8 — minimum rolling verdict match rate to remain eligible at tiers 2–5 (index 0 = tier 2). */
export const MIN_VERDICT_RATE_FOR_TIERS_2_TO_5 = [0.6, 0.7, 0.8, 0.85] as const;

export const TIER_TITLES = [
  "Junior Clerk",
  "Magistrate",
  "District Judge",
  "Circuit Judge",
  "Chief Justice",
] as const;

export function tierTitle(tier: number): string {
  const i = Math.min(Math.max(tier, 1), 5) - 1;
  return TIER_TITLES[i] ?? TIER_TITLES[0];
}

/** Highest tier (1–5) justified by career points alone. */
export function tierFromPoints(careerPoints: number): number {
  for (let i = TIER_POINT_FLOORS.length - 1; i >= 0; i--) {
    if (careerPoints >= TIER_POINT_FLOORS[i]) return i + 1;
  }
  return 1;
}

/**
 * Highest tier (1–5) allowed by verdict rate alone (tier 1 always allowed).
 * Uses the same thresholds as staying at tiers 2–5.
 */
export function tierFromVerdictRate(rate: number): number {
  let best = 1;
  for (let tier = 2; tier <= 5; tier++) {
    const minR = minVerdictRateForTier(tier);
    if (minR !== undefined && rate >= minR) best = tier;
  }
  return best;
}

export function minVerdictRateForTier(tier: number): number | undefined {
  if (tier <= 1 || tier > 5) return undefined;
  return MIN_VERDICT_RATE_FOR_TIERS_2_TO_5[tier - 2];
}

/** Highest tier the user may hold given points and rolling verdict rate. */
export function maxEligibleTier(careerPoints: number, verdictMatchRate: number): number {
  const byPoints = tierFromPoints(careerPoints);
  const byRate = tierFromVerdictRate(verdictMatchRate);
  return Math.min(byPoints, byRate);
}

/** YYYY-MM-DD in the given IANA time zone for `date`. */
export function formatDateInUserTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Whole calendar days between two YYYY-MM-DD strings (`later` − `earlier`). */
export function localDateDiffDays(later: string, earlier: string): number {
  const a = new Date(later + "T12:00:00.000Z").getTime();
  const b = new Date(earlier + "T12:00:00.000Z").getTime();
  return Math.round((a - b) / 86_400_000);
}

/** UTC calendar day used for `DailyChallenge` (matches `app/api/daily/route.ts`). */
export function utcChallengeDate(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function rollingVerdictMatchRate(
  rulings: Array<{ verdict: string; case: { correctVerdict: string } }>,
): number | null {
  if (rulings.length === 0) return null;
  let matches = 0;
  for (const r of rulings) {
    if (verdictMatches(r.verdict, r.case.correctVerdict)) matches += 1;
  }
  return matches / rulings.length;
}

/** Points needed to reach the next tier floor; `null` at tier 5. */
export function pointsToNextTier(careerPoints: number, currentTier: number): number | null {
  if (currentTier >= 5) return null;
  const nextFloor = TIER_POINT_FLOORS[currentTier];
  return Math.max(0, nextFloor - careerPoints);
}
