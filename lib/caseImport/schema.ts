import { CaseKind } from "@prisma/client";
import { z } from "zod";

const caseDocumentImportSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  sortOrder: z.number().int().min(0),
  isAdmissible: z.boolean(),
  isMaterial: z.boolean(),
});

const precedentImportSchema = z.object({
  name: z.string().min(1).max(500),
  citation: z.string().min(1).max(500),
  summary: z.string().min(1),
  sortOrder: z.number().int().min(0),
  isRelevant: z.boolean(),
  weightMultiplier: z.number().positive().max(10),
});

/**
 * Payload for `case-import.json` — matches nested create in
 * [`prisma/seed.ts`](../../prisma/seed.ts) (no DB `id` fields).
 */
export const caseImportSchema = z.object({
  title: z.string().min(1).max(500),
  tier: z.number().int().min(1).max(5),
  kind: z.nativeEnum(CaseKind),
  category: z.string().min(1).max(200),
  briefSummary: z.string().min(1),
  parTimeMinutes: z.number().int().min(1).max(240),
  correctVerdict: z.string().min(1).max(500),
  correctSentenceText: z.string().min(1),
  correctSentenceNumeric: z.number().finite().nullable().optional(),
  correctReasoningSummary: z.string().min(1),
  actualOpinionExcerpt: z.string().min(1),
  isOverturned: z.boolean(),
  appellateReversalSummary: z.string().min(1).nullable().optional(),
  appellateCorrectVerdict: z.string().min(1).nullable().optional(),
  appellateCorrectSentenceNumeric: z.number().finite().nullable().optional(),
  whyExplanation: z.string().min(1),
  maxPrecedents: z.number().int().min(1).max(20),
  requiresSubscription: z.boolean().optional().default(false),
  appellateSeat: z.boolean().optional().default(false),
  documents: z.array(caseDocumentImportSchema).min(1),
  precedents: z.array(precedentImportSchema).min(1),
});

export type CaseImportPayload = z.infer<typeof caseImportSchema>;

export function parseCaseImportJson(raw: unknown): CaseImportPayload {
  return caseImportSchema.parse(raw);
}

export function safeParseCaseImportJson(
  raw: unknown,
): { success: true; data: CaseImportPayload } | { success: false; error: z.ZodError } {
  const r = caseImportSchema.safeParse(raw);
  if (r.success) return { success: true, data: r.data };
  return { success: false, error: r.error };
}
