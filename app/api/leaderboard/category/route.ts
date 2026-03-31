import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MIN_PLAYS = 3;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim();
    if (!category) {
      return NextResponse.json({ error: "Missing category query param." }, { status: 400 });
    }

    const caseIds = (
      await prisma.case.findMany({
        where: { category },
        select: { id: true },
      })
    ).map((c) => c.id);

    if (caseIds.length === 0) {
      return NextResponse.json({ category, entries: [] as const, minPlays: MIN_PLAYS });
    }

    const rulings = await prisma.userRuling.findMany({
      where: {
        caseId: { in: caseIds },
        status: "SCORED",
        totalScore: { not: null },
      },
      select: { userId: true, totalScore: true },
    });

    type Agg = { sum: number; count: number };
    const byUser = new Map<string, Agg>();
    for (const r of rulings) {
      if (r.totalScore == null) continue;
      const prev = byUser.get(r.userId) ?? { sum: 0, count: 0 };
      prev.sum += r.totalScore;
      prev.count += 1;
      byUser.set(r.userId, prev);
    }

    const eligible = [...byUser.entries()].filter(([, v]) => v.count >= MIN_PLAYS);
    const userIds = eligible.map(([id]) => id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });
    const nameById = new Map(users.map((u) => [u.id, u]));

    const sorted = eligible
      .map(([userId, v]) => ({
        userId,
        totalScore: v.sum,
        plays: v.count,
        displayName: nameById.get(userId)?.name?.trim() || "Player",
        image: nameById.get(userId)?.image ?? null,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 50);

    const entries = sorted.map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      displayName: e.displayName,
      image: e.image,
      totalScore: e.totalScore,
      plays: e.plays,
    }));

    return NextResponse.json({ category, minPlays: MIN_PLAYS, entries });
  } catch (e) {
    console.error("[api/leaderboard/category]", e);
    return NextResponse.json({ error: "Could not load category board." }, { status: 500 });
  }
}
