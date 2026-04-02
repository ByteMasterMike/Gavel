import { resolveDailyCaseIdForUtcDate } from "@/lib/dailyPolicy";
import { prisma } from "@/lib/prisma";
import {
  localDateDiffDays,
  formatDateInUserTimeZone,
  maxEligibleTier,
  minVerdictRateForTier,
  rollingVerdictMatchRate,
  utcChallengeDate,
} from "@/lib/careerTier";

export type ApplyRulingRewardsMeta = {
  caseId: string;
  verdictMatch: boolean;
};

/**
 * Update morning docket streak, career points, tier promotion/demotion, and activity.
 */
export async function applyRulingRewards(
  userId: string,
  finalScore: number,
  meta: ApplyRulingRewardsMeta,
): Promise<void> {
  const { caseId } = meta;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        careerPoints: true,
        currentTier: true,
        streakDays: true,
        lastMorningDocketLocalDate: true,
        timezone: true,
        tierAccuracyWarning: true,
        rulingsSinceTierWarning: true,
      },
    });
    if (!user) return;

    const challengeDay = utcChallengeDate();
    const todaysDailyCaseId = await resolveDailyCaseIdForUtcDate(challengeDay);
    const isMorningDocket = todaysDailyCaseId === caseId;

    let streakDays = user.streakDays;
    let lastMorningDocketLocalDate = user.lastMorningDocketLocalDate;

    if (isMorningDocket) {
      const todayLocal = formatDateInUserTimeZone(new Date(), user.timezone);
      const last = user.lastMorningDocketLocalDate;

      if (last === todayLocal) {
        /* second play same local day — do not inflate streak */
      } else if (!last) {
        streakDays = 1;
        lastMorningDocketLocalDate = todayLocal;
      } else {
        const gap = localDateDiffDays(todayLocal, last);
        if (gap === 1) {
          streakDays = user.streakDays + 1;
          lastMorningDocketLocalDate = todayLocal;
        } else {
          streakDays = 1;
          lastMorningDocketLocalDate = todayLocal;
        }
      }
    }

    const newCareerPoints = user.careerPoints + finalScore;

    const recentScored = await tx.userRuling.findMany({
      where: { userId, status: "SCORED" },
      orderBy: { submittedAt: "desc" },
      take: 10,
      select: {
        verdict: true,
        case: { select: { correctVerdict: true } },
      },
    });

    const rate = rollingVerdictMatchRate(recentScored);

    let currentTier = user.currentTier;
    const maxEligible = maxEligibleTier(newCareerPoints, rate ?? 0);
    if (maxEligible > currentTier) currentTier = maxEligible;

    let tierAccuracyWarning = user.tierAccuracyWarning;
    let rulingsSinceTierWarning = user.rulingsSinceTierWarning;

    const t = currentTier;
    const minR = minVerdictRateForTier(t);

    if (t > 1 && recentScored.length >= 1 && rate !== null && minR !== undefined) {
      if (rate < minR) {
        if (!tierAccuracyWarning) {
          tierAccuracyWarning = true;
          rulingsSinceTierWarning = 0;
        } else {
          rulingsSinceTierWarning += 1;
          if (rulingsSinceTierWarning >= 5 && rate < minR) {
            currentTier = Math.max(1, currentTier - 1);
            tierAccuracyWarning = false;
            rulingsSinceTierWarning = 0;
          }
        }
      } else {
        tierAccuracyWarning = false;
        rulingsSinceTierWarning = 0;
      }
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        careerPoints: newCareerPoints,
        currentTier,
        streakDays,
        lastMorningDocketLocalDate,
        tierAccuracyWarning,
        rulingsSinceTierWarning,
        lastPlayedAt: new Date(),
      },
    });
  });
}
