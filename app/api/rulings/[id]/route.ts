import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const ruling = await prisma.userRuling.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!ruling || ruling.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const caseRow = ruling.case;

    return NextResponse.json({
      ruling: {
        id: ruling.id,
        status: ruling.status,
        verdict: ruling.verdict,
        sentenceText: ruling.sentenceText,
        sentenceNumeric: ruling.sentenceNumeric,
        findingsOfFact: ruling.findingsOfFact,
        applicationOfLaw: ruling.applicationOfLaw,
        mitigatingFactors: ruling.mitigatingFactors,
        accuracyScore: ruling.accuracyScore,
        styleScore: ruling.styleScore,
        totalScore: ruling.totalScore,
        llmFeedback: ruling.llmFeedback,
        scoreBreakdown: ruling.scoreBreakdown,
        judgeRank: ruling.judgeRank,
        judgeRankDescription: ruling.judgeRankDescription,
      },
      reveal: {
        correctVerdict: caseRow.correctVerdict,
        correctSentenceText: caseRow.correctSentenceText,
        correctSentenceNumeric: caseRow.correctSentenceNumeric,
        actualOpinionExcerpt: caseRow.actualOpinionExcerpt,
        whyExplanation: caseRow.whyExplanation,
        isOverturned: caseRow.isOverturned,
        appellateReversalSummary: caseRow.appellateReversalSummary,
        title: caseRow.title,
        kind: caseRow.kind,
        appellateSeat: caseRow.appellateSeat,
      },
    });
  } catch (e) {
    console.error("[api/rulings/[id]]", e);
    return NextResponse.json({ error: "Could not load ruling." }, { status: 500 });
  }
}
