import type { Case, CaseDocument, Precedent, User, UserRuling } from "@prisma/client";
import { getUtcTodayDailyCaseId } from "@/lib/dailyPolicy";
import { evaluateReasoning, formatReasoningFeedbackForDisplay } from "@/lib/llm/evaluateReasoning";
import { DEGRADED_LLM_MESSAGE, shouldDegradeLlmScoring } from "@/lib/tokenBudget";
import { computeAccuracyScore } from "./accuracyScore";
import { computePrescientJustice } from "./prescientJustice";
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

  const citedIds = ruling.citedPrecedentIds;
  const cited = caseRow.precedents.filter((p) => citedIds.includes(p.id));
  const citedPrecedentSummaries = cited
    .map((p) => `- ${p.name} (${p.citation}): ${p.summary.slice(0, 400)}`)
    .join("\n");

  const todaysDailyCaseId = await getUtcTodayDailyCaseId();
  const degradeReasoning = await shouldDegradeLlmScoring(user, caseRow.id, todaysDailyCaseId);

  const llm = degradeReasoning
    ? { score: 0.5, feedback: DEGRADED_LLM_MESSAGE, improvements: [] as string[] }
    : await evaluateReasoning({
        studentVerdict: ruling.verdict,
        studentSentenceText: ruling.sentenceText,
        studentSentenceNumeric: ruling.sentenceNumeric,
        studentFindings: ruling.findingsOfFact,
        studentApplication: ruling.applicationOfLaw,
        studentMitigating: ruling.mitigatingFactors,
        citedPrecedentSummaries,
        correctReasoningSummary: caseRow.correctReasoningSummary,
        actualOpinionExcerpt: caseRow.actualOpinionExcerpt,
        usageLog: { userId: user.id, rulingId: ruling.id },
      });

  const accuracyParts = computeAccuracyScore(
    caseRow,
    ruling.verdict,
    ruling.sentenceText,
    ruling.sentenceNumeric,
    llm.score,
  );

  const prescient = computePrescientJustice(
    caseRow,
    ruling.verdict,
    ruling.sentenceText,
    ruling.sentenceNumeric,
  );
  const accuracyTotalWithPrescient = accuracyParts.total + prescient.points;

  const styleParts = computeStyleScore({
    citedPrecedentIds: ruling.citedPrecedentIds,
    hintsUsed: ruling.hintsUsed,
    flaggedDocIds: ruling.flaggedDocIds,
    openedDocIds: ruling.openedDocIds,
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
    accuracyTotalWithPrescient,
    styleParts.total,
    streak,
    indec,
  );
  const finalTotal = Math.round(weightedSubtotal * tMul);

  const breakdown: ScoreBreakdownPayload = {
    accuracy: {
      total: accuracyTotalWithPrescient,
      verdictMatch: accuracyParts.verdictMatch,
      verdictPoints: accuracyParts.verdictPoints,
      damagesPoints: accuracyParts.damagesPoints,
      reasoningPoints: accuracyParts.reasoningPoints,
      sentenceRangeScore: accuracyParts.sentenceRangeScore,
      llmScore: accuracyParts.llmScore,
      ...(degradeReasoning ? { reasoningDegraded: true as const } : {}),
      ...(prescient.points > 0
        ? {
            prescientJustice: {
              points: prescient.points,
              verdictBonus: prescient.verdictBonus,
              damagesBonus: prescient.damagesBonus,
              debatePrompt: prescient.debatePrompt,
            },
          }
        : {}),
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
    accuracyTotal: accuracyTotalWithPrescient,
    tier: caseRow.tier,
    hintsUsed: ruling.hintsUsed,
    elapsedMin,
    parMinutes: caseRow.parTimeMinutes,
  });

  return {
    accuracyTotal: accuracyTotalWithPrescient,
    styleTotal: styleParts.total,
    finalTotal,
    breakdown,
    judgeRankKey: rank.key,
    judgeRankTitle: rank.title,
    judgeRankDescription: rank.description,
    llmFeedback: formatReasoningFeedbackForDisplay(llm),
  };
}
