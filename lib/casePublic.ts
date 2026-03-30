import type { Case, CaseDocument, Precedent } from "@prisma/client";
import type { PublicCasePayload } from "@/types";

export function toPublicCase(
  row: Case & { documents: CaseDocument[]; precedents: Precedent[] },
): PublicCasePayload {
  return {
    id: row.id,
    title: row.title,
    tier: row.tier,
    kind: row.kind,
    category: row.category,
    briefSummary: row.briefSummary,
    parTimeMinutes: row.parTimeMinutes,
    maxPrecedents: row.maxPrecedents,
    documents: row.documents
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((d) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        sortOrder: d.sortOrder,
      })),
    precedents: row.precedents
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        name: p.name,
        citation: p.citation,
        summary: p.summary,
        sortOrder: p.sortOrder,
      })),
  };
}
