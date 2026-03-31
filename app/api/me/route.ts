import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  pointsToNextTier,
  rollingVerdictMatchRate,
  tierTitle,
} from "@/lib/careerTier";

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

    return NextResponse.json({
      user: {
        ...user,
        tierTitle: tierTitle(user.currentTier),
        rollingVerdictRate,
        pointsToNextTier: pointsToNextTier(user.careerPoints, user.currentTier),
        scoredRulingsCount: verdictCount,
      },
    });
  } catch (e) {
    console.error("[api/me]", e);
    return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
  }
}
