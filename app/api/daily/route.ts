import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicCase } from "@/lib/casePublic";

export async function GET() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

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
