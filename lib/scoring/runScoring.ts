import type { Case, CaseDocument, Precedent, User, UserRuling } from "@prisma/client";
import { jsonToStringArray } from "@/lib/jsonIds";
import { evaluateReasoning } from "@/lib/llm/evaluateReasoning";
import { computeAccuracyScore } from "./accuracyScore";
import { computeStyleScore } from "./styleScore";
import {
  computeWeightedTrialScore,
  indecisionPenalty,
  judgeRank,
  streakBonus,
  tierMultiplier,
} from "./totalScore";
import type { ScoreBreakdownPayload } from "@/types";

export async function scoreRuling(params: {
  caseRow: Case & { documents: CaseDocument[]; precedents: Precedent[] };
  ruling: UserRuling;
  user: User;
}): Promise<{
  accuracyTotal: number;
  styleTotal: number;
  finalTotal: number;
  breakdown: ScoreBreakdownPayload;
  judgeRankKey: string;
  judgeRankTitle: string;
  judgeRankDescription: string;
  llmFeedback: string;
}> {
  const { caseRow, ruling, user } = params;

  const citedIds = jsonToStringArray(ruling.citedPrecedentIds);
  const cited = caseRow.precedents.filter((p) => citedIds.includes(p.id));
  const citedPrecedentSummaries = cited
    .map((p) => `- ${p.name} (${p.citation}): ${p.summary.slice(0, 400)}`)
    .join("\n");

  const llm = await evaluateReasoning({
    studentFindings: ruling.findingsOfFact,
    studentApplication: ruling.applicationOfLaw,
    studentMitigating: ruling.mitigatingFactors,
    citedPrecedentSummaries,
    correctReasoningSummary: caseRow.correctReasoningSummary,
    actualOpinionExcerpt: caseRow.actualOpinionExcerpt,
  });

  const accuracyParts = computeAccuracyScore(
    caseRow,
    ruling.verdict,
    ruling.sentenceText,
    ruling.sentenceNumeric,
    llm.score,
  );

  const styleParts = computeStyleScore({
    citedPrecedentIds: citedIds,
    hintsUsed: ruling.hintsUsed,
    flaggedDocIds: jsonToStringArray(ruling.flaggedDocIds),
    openedDocIds: jsonToStringArray(ruling.openedDocIds),
    verdictFlips: ruling.verdictFlips,
    startedAt: ruling.startedAt,
    submittedAt: ruling.submittedAt,
    parTimeMinutes: caseRow.parTimeMinutes,
    documents: caseRow.documents,
    precedents: caseRow.precedents,
  });

  const streak = streakBonus(user.streakDays);
  const indec = indecisionPenalty(ruling.verdictFlips);
  const tMul = tierMultiplier(caseRow.tier);

  const stylePayload: ScoreBreakdownPayload["style"] = {
    total: styleParts.total,
    precedentRaw: styleParts.precedentRaw,
    objectionRaw: styleParts.objectionRaw,
    efficiencyRaw: styleParts.efficiencyRaw,
    speedRaw: styleParts.speedRaw,
    precedentNorm: styleParts.precedentNorm,
    objectionNorm: styleParts.objectionNorm,
    efficiencyNorm: styleParts.efficiencyNorm,
    speedNorm: styleParts.speedNorm,
  };

  const weightedSubtotal = computeWeightedTrialScore(
    accuracyParts.total,
    styleParts.total,
    streak,
    indec,
  );
  const finalTotal = Math.round(weightedSubtotal * tMul);

  const breakdown: ScoreBreakdownPayload = {
    accuracy: {
      total: accuracyParts.total,
      verdictMatch: accuracyParts.verdictMatch,
      verdictPoints: accuracyParts.verdictPoints,
      damagesPoints: accuracyParts.damagesPoints,
      reasoningPoints: accuracyParts.reasoningPoints,
      sentenceRangeScore: accuracyParts.sentenceRangeScore,
      llmScore: accuracyParts.llmScore,
    },
    style: stylePayload,
    streakBonus: streak,
    indecisionPenalty: indec,
    tierMultiplier: tMul,
    weightedSubtotal,
    finalTotal,
  };

  const elapsedMin = (ruling.submittedAt.getTime() - ruling.startedAt.getTime()) / 60000;
  const rank = judgeRank(finalTotal, {
    verdictMatch: accuracyParts.verdictMatch,
    styleTotal: styleParts.total,
    accuracyTotal: accuracyParts.total,
    tier: caseRow.tier,
    hintsUsed: ruling.hintsUsed,
    elapsedMin,
    parMinutes: caseRow.parTimeMinutes,
  });

  return {
    accuracyTotal: accuracyParts.total,
    styleTotal: styleParts.total,
    finalTotal,
    breakdown,
    judgeRankKey: rank.key,
    judgeRankTitle: rank.title,
    judgeRankDescription: rank.description,
    llmFeedback: llm.feedback,
  };
}
