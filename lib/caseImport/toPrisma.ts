import type { Prisma } from "@prisma/client";
import type { CaseImportPayload } from "./schema";

export function caseImportToPrismaCreate(data: CaseImportPayload): Prisma.CaseCreateInput {
  return {
    title: data.title,
    tier: data.tier,
    kind: data.kind,
    category: data.category,
    briefSummary: data.briefSummary,
    parTimeMinutes: data.parTimeMinutes,
    correctVerdict: data.correctVerdict,
    correctSentenceText: data.correctSentenceText,
    correctSentenceNumeric: data.correctSentenceNumeric ?? null,
    correctReasoningSummary: data.correctReasoningSummary,
    actualOpinionExcerpt: data.actualOpinionExcerpt,
    isOverturned: data.isOverturned,
    appellateReversalSummary: data.appellateReversalSummary ?? null,
    appellateCorrectVerdict: data.appellateCorrectVerdict ?? null,
    appellateCorrectSentenceNumeric: data.appellateCorrectSentenceNumeric ?? null,
    whyExplanation: data.whyExplanation,
    maxPrecedents: data.maxPrecedents,
    requiresSubscription: data.requiresSubscription,
    appellateSeat: data.appellateSeat,
    documents: {
      create: data.documents.map((d) => ({
        title: d.title,
        content: d.content,
        sortOrder: d.sortOrder,
        isAdmissible: d.isAdmissible,
        isMaterial: d.isMaterial,
      })),
    },
    precedents: {
      create: data.precedents.map((p) => ({
        name: p.name,
        citation: p.citation,
        summary: p.summary,
        sortOrder: p.sortOrder,
        isRelevant: p.isRelevant,
        weightMultiplier: p.weightMultiplier,
      })),
    },
  };
}
