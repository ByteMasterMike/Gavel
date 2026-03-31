import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIERS = new Set([1, 2, 3, 4, 5]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tierRaw = searchParams.get("tier");
    const tier = tierRaw == null ? 1 : Number(tierRaw);
    if (!Number.isInteger(tier) || !TIERS.has(tier)) {
      return NextResponse.json({ error: "Invalid tier (use 1–5)." }, { status: 400 });
    }

    const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit")) || 25));

    const users = await prisma.user.findMany({
      where: { currentTier: tier },
      orderBy: { careerPoints: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        image: true,
        careerPoints: true,
        currentTier: true,
      },
    });

    const entries = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      displayName: u.name?.trim() || "Player",
      image: u.image,
      careerPoints: u.careerPoints,
      tier: u.currentTier,
    }));

    return NextResponse.json({ tier, entries });
  } catch (e) {
    console.error("[api/leaderboard/career]", e);
    return NextResponse.json({ error: "Could not load career board." }, { status: 500 });
  }
}
