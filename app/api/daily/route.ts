import { NextResponse } from "next/server";
import { utcChallengeDate } from "@/lib/careerTier";
import { resolveDailyCaseIdForUtcDate } from "@/lib/dailyPolicy";
import { prisma } from "@/lib/prisma";
import { toPublicCase } from "@/lib/casePublic";

export async function GET(req: Request) {
  const today = utcChallengeDate();

  const { searchParams } = new URL(req.url);
  const summaryOnly =
    searchParams.get("summary") === "1" || searchParams.get("lite") === "1";

  try {
    const caseId = await resolveDailyCaseIdForUtcDate(today);
    if (!caseId) {
      return NextResponse.json({ daily: null, message: "No cases in catalog for Morning Docket." });
    }

    if (summaryOnly) {
      const row = await prisma.case.findUnique({
        where: { id: caseId },
        select: {
          id: true,
          title: true,
          tier: true,
          category: true,
          briefSummary: true,
        },
      });
      if (!row) {
        return NextResponse.json({ daily: null, message: "Morning Docket case not found." }, { status: 404 });
      }

      return NextResponse.json({
        daily: {
          date: today,
          case: {
            id: row.id,
            title: row.title,
            tier: row.tier,
            category: row.category,
            briefSummary: row.briefSummary,
          },
        },
      });
    }

    const caseRow = await prisma.case.findUnique({
      where: { id: caseId },
      include: { documents: true, precedents: true },
    });

    if (!caseRow) {
      return NextResponse.json({ daily: null, message: "Morning Docket case not found." }, { status: 404 });
    }

    return NextResponse.json({
      daily: { date: today, case: toPublicCase(caseRow) },
    });
  } catch (e) {
    console.error("[api/daily]", e);
    return NextResponse.json({ error: "Could not load daily challenge." }, { status: 500 });
  }
}
