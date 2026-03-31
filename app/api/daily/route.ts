import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicCase } from "@/lib/casePublic";

export async function GET(req: Request) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { searchParams } = new URL(req.url);
  const summaryOnly =
    searchParams.get("summary") === "1" || searchParams.get("lite") === "1";

  if (summaryOnly) {
    const daily = await prisma.dailyChallenge.findUnique({
      where: { date: today },
      select: {
        date: true,
        case: { select: { id: true } },
      },
    });

    if (!daily?.case) {
      return NextResponse.json({ daily: null, message: "No daily challenge configured." });
    }

    return NextResponse.json({
      daily: { date: daily.date, case: { id: daily.case.id } },
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
}
