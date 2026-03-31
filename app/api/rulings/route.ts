import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isExpiredPastDailyCase } from "@/lib/dailyPolicy";
import { evaluateCaseAccess, getTodaysDailyCaseId } from "@/lib/caseAccess";
import { checkRulingSubmissionRate } from "@/lib/rulingRateLimit";
import { scoreRuling } from "@/lib/scoring/runScoring";
import { tryAwardMorningGavelBadge } from "@/lib/morningGavel";
import { applyRulingRewards } from "@/lib/userProgress";
import type { RulingSubmissionBody } from "@/types";

function parseBody(json: unknown): RulingSubmissionBody | null {
  if (!json || typeof json !== "object") return null;
  const b = json as Record<string, unknown>;
  if (typeof b.caseId !== "string") return null;
  if (typeof b.verdict !== "string") return null;
  if (typeof b.sentenceText !== "string") return null;
  if (typeof b.findingsOfFact !== "string") return null;
  if (typeof b.applicationOfLaw !== "string") return null;
  if (typeof b.mitigatingFactors !== "string") return null;
  if (!Array.isArray(b.flaggedDocIds) || !b.flaggedDocIds.every((x) => typeof x === "string"))
    return null;
  if (!Array.isArray(b.starredDocIds) || !b.starredDocIds.every((x) => typeof x === "string"))
    return null;
  if (
    !Array.isArray(b.citedPrecedentIds) ||
    !b.citedPrecedentIds.every((x) => typeof x === "string")
  )
    return null;
  if (!Array.isArray(b.openedDocIds) || !b.openedDocIds.every((x) => typeof x === "string"))
    return null;
  const hintsUsed = typeof b.hintsUsed === "number" ? b.hintsUsed : Number(b.hintsUsed);
  const verdictFlips = typeof b.verdictFlips === "number" ? b.verdictFlips : Number(b.verdictFlips);
  if (!Number.isFinite(hintsUsed) || !Number.isFinite(verdictFlips)) return null;
  if (typeof b.startedAt !== "string") return null;
  if (typeof b.submittedAt !== "string") return null;
  if (b.sessionId !== undefined && b.sessionId !== null && typeof b.sessionId !== "string") {
    return null;
  }
  const sessionId =
    b.sessionId === undefined || b.sessionId === null || b.sessionId === ""
      ? null
      : b.sessionId;
  return {
    caseId: b.caseId,
    verdict: b.verdict,
    sentenceText: b.sentenceText,
    sentenceNumeric:
      b.sentenceNumeric === null || b.sentenceNumeric === undefined
        ? null
        : Number(b.sentenceNumeric),
    findingsOfFact: b.findingsOfFact,
    applicationOfLaw: b.applicationOfLaw,
    mitigatingFactors: b.mitigatingFactors,
    flaggedDocIds: b.flaggedDocIds,
    starredDocIds: b.starredDocIds,
    citedPrecedentIds: b.citedPrecedentIds,
    openedDocIds: b.openedDocIds,
    hintsUsed: Math.max(0, Math.floor(hintsUsed)),
    verdictFlips: Math.max(0, Math.floor(verdictFlips)),
    startedAt: b.startedAt,
    submittedAt: b.submittedAt,
    sessionId,
  };
}

async function runScoreJob(rulingId: string) {
  const ruling = await prisma.userRuling.findUnique({ where: { id: rulingId } });
  if (!ruling) return;

  const caseRow = await prisma.case.findUnique({
    where: { id: ruling.caseId },
    include: { documents: true, precedents: true },
  });
  if (!caseRow) return;

  const user = await prisma.user.findUnique({ where: { id: ruling.userId } });
  if (!user) return;

  const result = await scoreRuling({ caseRow, ruling, user });

  await prisma.userRuling.update({
    where: { id: rulingId },
    data: {
      status: "SCORED",
      accuracyScore: result.accuracyTotal,
      styleScore: result.styleTotal,
      totalScore: result.finalTotal,
      llmScoreRaw: result.breakdown.accuracy.llmScore,
      llmFeedback: result.llmFeedback,
      scoreBreakdown: result.breakdown as unknown as Prisma.InputJsonValue,
      judgeRank: result.judgeRankTitle,
      judgeRankDescription: result.judgeRankDescription,
    },
  });

  await applyRulingRewards(ruling.userId, result.finalTotal, {
    caseId: ruling.caseId,
    verdictMatch: result.breakdown.accuracy.verdictMatch,
  });

  await tryAwardMorningGavelBadge({
    userId: ruling.userId,
    caseId: ruling.caseId,
    submittedAt: ruling.submittedAt,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let dbUser;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        currentTier: true,
        subscriptionStatus: true,
        subscriptionValidUntil: true,
      },
    });
  } catch (e) {
    console.error("[ruling POST] user lookup", e);
    return NextResponse.json({ error: "Could not verify account." }, { status: 500 });
  }

  if (!dbUser) {
    return NextResponse.json(
      {
        error:
          "Your session no longer matches an account in the database (for example after a dev reset). Sign out and sign in again.",
      },
      { status: 401 },
    );
  }

  const rate = checkRulingSubmissionRate(userId);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid body — check that all fields are present and arrays are valid JSON." },
      { status: 400 },
    );
  }

  let caseRow;
  try {
    caseRow = await prisma.case.findUnique({ where: { id: parsed.caseId } });
  } catch (e) {
    console.error("[ruling POST] case lookup", e);
    return NextResponse.json({ error: "Could not load case." }, { status: 500 });
  }

  if (!caseRow) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  if (await isExpiredPastDailyCase(caseRow.id)) {
    return NextResponse.json(
      { error: "This Morning Docket case is no longer available." },
      { status: 403 },
    );
  }

  const todaysDailyCaseId = await getTodaysDailyCaseId();
  const access = evaluateCaseAccess({
    sessionUserId: userId,
    userTier: dbUser.currentTier,
    subscription: {
      subscriptionStatus: dbUser.subscriptionStatus,
      subscriptionValidUntil: dbUser.subscriptionValidUntil,
    },
    caseRow: {
      id: caseRow.id,
      tier: caseRow.tier,
      requiresSubscription: caseRow.requiresSubscription,
    },
    todaysDailyCaseId,
  });
  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
  }

  if (parsed.citedPrecedentIds.length > caseRow.maxPrecedents) {
    return NextResponse.json({ error: "Too many precedents cited" }, { status: 400 });
  }

  const sn =
    parsed.sentenceNumeric != null && Number.isFinite(parsed.sentenceNumeric)
      ? parsed.sentenceNumeric
      : null;

  try {
    const ruling = await prisma.userRuling.create({
      data: {
        userId,
        caseId: parsed.caseId,
        sessionId: parsed.sessionId ?? undefined,
        verdict: parsed.verdict,
        sentenceText: parsed.sentenceText,
        sentenceNumeric: sn,
        findingsOfFact: parsed.findingsOfFact,
        applicationOfLaw: parsed.applicationOfLaw,
        mitigatingFactors: parsed.mitigatingFactors,
        flaggedDocIds: parsed.flaggedDocIds,
        starredDocIds: parsed.starredDocIds,
        citedPrecedentIds: parsed.citedPrecedentIds,
        openedDocIds: parsed.openedDocIds,
        hintsUsed: parsed.hintsUsed,
        verdictFlips: parsed.verdictFlips,
        startedAt: new Date(parsed.startedAt),
        submittedAt: new Date(parsed.submittedAt),
        status: "PENDING",
      },
    });

    void runScoreJob(ruling.id).catch((e) => console.error("[ruling score]", e));

    return NextResponse.json({ rulingId: ruling.id, status: "PENDING" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database error";
    console.error("[ruling create]", e);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? msg : "Could not save ruling." },
      { status: 500 },
    );
  }
}
