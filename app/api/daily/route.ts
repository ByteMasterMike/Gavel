import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicCase } from "@/lib/casePublic";

export async function GET(req: Request) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { searchParams } = new URL(req.url);
  const summaryOnly =
    searchParams.get("summary") === "1" || searchParams.get("lite") === "1";

  try {
    if (summaryOnly) {
      const daily = await prisma.dailyChallenge.findUnique({
        where: { date: today },
        select: {
          date: true,
          case: {
            select: {
              id: true,
              title: true,
              tier: true,
              category: true,
              briefSummary: true,
            },
          },
        },
      });

      if (!daily?.case) {
        return NextResponse.json({ daily: null, message: "No daily challenge configured." });
      }

      return NextResponse.json({
        daily: {
          date: daily.date,
          case: {
            id: daily.case.id,
            title: daily.case.title,
            tier: daily.case.tier,
            category: daily.case.category,
            briefSummary: daily.case.briefSummary,
          },
        },
      });
    }

    const daily = await prisma.dailyChallenge.findUnique({
      where: { date: today },
      include: { case: { include: { documents: true, precedents: true } } },
    });

    if (!daily?.case) {
      return NextResponse.json({ daily: null, message: "No daily challenge configured." });
    }

    return NextResponse.json({
      daily: { date: daily.date, case: toPublicCase(daily.case) },
    });
  } catch (e) {
    console.error("[api/daily]", e);
    return NextResponse.json({ error: "Could not load daily challenge." }, { status: 500 });
  }
}
