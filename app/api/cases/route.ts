import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      orderBy: [{ tier: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        tier: true,
        kind: true,
        category: true,
        parTimeMinutes: true,
      },
    });
    return NextResponse.json({ cases }, { headers: cacheHeaders });
  } catch (e) {
    console.error("[api/cases]", e);
    return NextResponse.json({ error: "Could not load cases." }, { status: 500 });
  }
}
