import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  pointsToNextTier,
  rollingVerdictMatchRate,
  tierTitle,
} from "@/lib/careerTier";
import { userHasActiveSubscription } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return NextResponse.json({ user: null });

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        careerPoints: true,
        currentTier: true,
        streakDays: true,
        lastPlayedAt: true,
        timezone: true,
        lastMorningDocketLocalDate: true,
        tierAccuracyWarning: true,
        subscriptionStatus: true,
        subscriptionValidUntil: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const recentScored = await prisma.userRuling.findMany({
      where: { userId: id, status: "SCORED" },
      orderBy: { submittedAt: "desc" },
      take: 10,
      select: {
        verdict: true,
        case: { select: { correctVerdict: true } },
      },
    });

    const rawRate = rollingVerdictMatchRate(recentScored);
    const rollingVerdictRate =
      rawRate === null ? null : Math.round(rawRate * 100) / 100;

    const verdictCount = await prisma.userRuling.count({
      where: { userId: id, status: "SCORED" },
    });

    const [morningGavelCount, morningGavelRows] = await Promise.all([
      prisma.morningGavelBadge.count({ where: { userId: id } }),
      prisma.morningGavelBadge.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          localDateYmd: true,
          rank: true,
          totalScore: true,
          caseId: true,
          timeZoneUsed: true,
          createdAt: true,
        },
      }),
    ]);

    const caseIds = [...new Set(morningGavelRows.map((b) => b.caseId))];
    const cases = await prisma.case.findMany({
      where: { id: { in: caseIds } },
      select: { id: true, title: true },
    });
    const titleByCaseId = new Map(cases.map((c) => [c.id, c.title]));

    const morningGavelBadges = morningGavelRows.map((b) => ({
      id: b.id,
      localDateYmd: b.localDateYmd,
      rank: b.rank,
      totalScore: b.totalScore,
      caseId: b.caseId,
      caseTitle: titleByCaseId.get(b.caseId) ?? null,
      timeZoneUsed: b.timeZoneUsed,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json({
      user: {
        ...user,
        tierTitle: tierTitle(user.currentTier),
        rollingVerdictRate,
        pointsToNextTier: pointsToNextTier(user.careerPoints, user.currentTier),
        scoredRulingsCount: verdictCount,
        morningGavelCount,
        morningGavelBadges,
        hasActiveSubscription: userHasActiveSubscription({
          subscriptionStatus: user.subscriptionStatus,
          subscriptionValidUntil: user.subscriptionValidUntil,
        }),
      },
    });
  } catch (e) {
    console.error("[api/me]", e);
    return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
  }
}
