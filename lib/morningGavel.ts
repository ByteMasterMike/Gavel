import { prisma } from "@/lib/prisma";
import { formatDateInUserTimeZone } from "@/lib/careerTier";
import { localDayBounds, resolveDailyCaseIdForUtcDate, resolveLeaderboardTimeZone } from "@/lib/dailyPolicy";
import { utcCalendarDateOnly } from "@/lib/dailyRotation";

/**
 * If this ruling is on the UTC-dated Morning Docket for `submittedAt` and the user's best score that local day is top 10, record Morning Gavel.
 */
export async function tryAwardMorningGavelBadge(input: {
  userId: string;
  caseId: string;
  submittedAt: Date;
}): Promise<void> {
  const expectedCaseId = await resolveDailyCaseIdForUtcDate(utcCalendarDateOnly(input.submittedAt));
  if (!expectedCaseId || expectedCaseId !== input.caseId) return;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { timezone: true },
  });
  if (!user) return;

  const tz = resolveLeaderboardTimeZone(user.timezone);
  const { start, end } = localDayBounds(tz, input.submittedAt);
  const ymd = formatDateInUserTimeZone(input.submittedAt, tz);

  const rulings = await prisma.userRuling.findMany({
    where: {
      caseId: input.caseId,
      status: "SCORED",
      submittedAt: { gte: start, lt: end },
      totalScore: { not: null },
    },
    select: {
      userId: true,
      totalScore: true,
    },
    orderBy: { totalScore: "desc" },
  });

  const best = new Map<string, number>();
  for (const r of rulings) {
    if (r.totalScore == null) continue;
    const prev = best.get(r.userId);
    if (prev == null || r.totalScore > prev) best.set(r.userId, r.totalScore);
  }

  const sorted = [...best.entries()].sort((a, b) => b[1] - a[1]);
  const idx = sorted.findIndex(([id]) => id === input.userId);
  if (idx < 0 || idx > 9) return;

  const rank = idx + 1;
  const totalScore = sorted[idx][1];

  await prisma.morningGavelBadge.upsert({
    where: {
      userId_localDateYmd_caseId: {
        userId: input.userId,
        localDateYmd: ymd,
        caseId: input.caseId,
      },
    },
    create: {
      userId: input.userId,
      localDateYmd: ymd,
      timeZoneUsed: tz,
      caseId: input.caseId,
      rank,
      totalScore,
    },
    update: { rank, totalScore, timeZoneUsed: tz },
  });
}
