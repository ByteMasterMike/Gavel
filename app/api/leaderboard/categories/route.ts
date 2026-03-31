import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.case.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return NextResponse.json({ categories: rows.map((r) => r.category) });
  } catch (e) {
    console.error("[api/leaderboard/categories]", e);
    return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
  }
}
