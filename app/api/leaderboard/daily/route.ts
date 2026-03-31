import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getUtcTodayDailyCaseId,
  localDayBounds,
  resolveLeaderboardTimeZone,
} from "@/lib/dailyPolicy";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth();
    const sessionUser = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { timezone: true },
        })
      : null;
    const tzParam = searchParams.get("timeZone");
    const timeZone = resolveLeaderboardTimeZone(
      tzParam ?? sessionUser?.timezone ?? undefined,
    );

    const caseId = await getUtcTodayDailyCaseId();
    if (!caseId) {
      return NextResponse.json({
        date: new Date().toISOString(),
        timeZone,
        caseId: null,
        caseTitle: null,
        entries: [] as const,
        me: null as null,
      });
    }

    const dailyMeta = await prisma.case.findUnique({
      where: { id: caseId },
      select: { title: true },
    });

    const { start, end } = localDayBounds(timeZone, new Date());

    const rulings = await prisma.userRuling.findMany({
      where: {
        caseId,
        status: "SCORED",
        submittedAt: { gte: start, lt: end },
        totalScore: { not: null },
      },
      select: {
        userId: true,
        totalScore: true,
        user: { select: { name: true, image: true } },
      },
      orderBy: { totalScore: "desc" },
    });

    const best = new Map<
      string,
      { totalScore: number; displayName: string; image: string | null }
    >();

    for (const r of rulings) {
      if (r.totalScore == null) continue;
      const prev = best.get(r.userId);
      const displayName = r.user.name?.trim() || "Player";
      if (!prev || r.totalScore > prev.totalScore) {
        best.set(r.userId, {
          totalScore: r.totalScore,
          displayName,
          image: r.user.image,
        });
      }
    }

    const sorted = [...best.entries()].sort((a, b) => b[1].totalScore - a[1].totalScore);

    const entries = sorted.slice(0, 50).map(([userId, v], i) => ({
      rank: i + 1,
      userId,
      displayName: v.displayName,
      image: v.image,
      totalScore: v.totalScore,
    }));

    const myId = session?.user?.id;
    let me: { rank: number; totalScore: number; displayName: string } | null = null;
    if (myId) {
      const idx = sorted.findIndex(([id]) => id === myId);
      if (idx >= 0) {
        me = {
          rank: idx + 1,
          totalScore: sorted[idx][1].totalScore,
          displayName: sorted[idx][1].displayName,
        };
      }
    }

    return NextResponse.json({
      date: start.toISOString(),
      timeZone,
      caseId,
      caseTitle: dailyMeta?.title ?? null,
      entries,
      me,
    });
  } catch (e) {
    console.error("[api/leaderboard/daily]", e);
    return NextResponse.json({ error: "Could not load leaderboard." }, { status: 500 });
  }
}
