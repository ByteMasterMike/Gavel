import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function utcDayBounds(): { start: Date; end: Date } {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function GET() {
  try {
    const { start, end } = utcDayBounds();

    const daily = await prisma.dailyChallenge.findUnique({
      where: { date: start },
      include: { case: { select: { id: true, title: true } } },
    });

    if (!daily?.case) {
      return NextResponse.json({
        date: start.toISOString(),
        caseId: null,
        caseTitle: null,
        entries: [] as const,
        me: null as null,
      });
    }

    const rulings = await prisma.userRuling.findMany({
      where: {
        caseId: daily.caseId,
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

    const session = await auth();
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
      caseId: daily.case.id,
      caseTitle: daily.case.title,
      entries,
      me,
    });
  } catch (e) {
    console.error("[api/leaderboard/daily]", e);
    return NextResponse.json({ error: "Could not load leaderboard." }, { status: 500 });
  }
}
