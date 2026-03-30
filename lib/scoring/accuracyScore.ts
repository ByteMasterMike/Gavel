import type { Case } from "@prisma/client";

function normalizeVerdict(v: string): string {
  return v.trim().toUpperCase().replace(/\s+/g, "_");
}

export function verdictMatches(player: string, correct: string): boolean {
  const p = normalizeVerdict(player);
  const c = normalizeVerdict(correct);
  if (p === c) return true;
  // Common aliases
  const aliases: Record<string, string[]> = {
    GUILTY: ["GUILTY_AS_CHARGED", "CONVICTED"],
    NOT_GUILTY: ["ACQUITTED", "NOT_RESPONSIBLE"],
    LIABLE: ["LIABILITY", "RESPONSIBLE"],
    NOT_LIABLE: ["NOT_RESPONSIBLE_CIVIL", "NO_LIABILITY"],
  };
  for (const [canon, alts] of Object.entries(aliases)) {
    if (c === canon && alts.includes(p)) return true;
    if (p === canon && alts.includes(c)) return true;
  }
  return false;
}

/** PRD §5 — range scoring on numeric damages/fine/sentence anchor */
export function sentenceRangeScore(
  playerNumeric: number | null | undefined,
  correctNumeric: number | null | undefined,
  playerText: string,
  correctText: string,
): number {
  if (
    playerNumeric != null &&
    correctNumeric != null &&
    correctNumeric !== 0 &&
    Number.isFinite(playerNumeric) &&
    Number.isFinite(correctNumeric)
  ) {
    const diff = Math.abs(playerNumeric - correctNumeric) / Math.abs(correctNumeric);
    if (diff === 0) return 1;
    if (diff <= 0.1) return 0.8;
    if (diff <= 0.25) return 0.5;
    if (diff <= 0.5) return 0.25;
    return 0;
  }
  // Non-numeric: light category overlap
  const a = playerText.toLowerCase();
  const b = correctText.toLowerCase();
  const tokens = b.split(/\W+/).filter((w) => w.length > 3);
  const hits = tokens.filter((t) => a.includes(t)).length;
  const ratio = tokens.length ? hits / Math.min(tokens.length, 8) : 0;
  if (ratio >= 0.5) return 1;
  if (ratio >= 0.35) return 0.7;
  if (ratio >= 0.2) return 0.45;
  return 0.2;
}

export interface AccuracyParts {
  verdictMatch: boolean;
  verdictPoints: number;
  damagesPoints: number;
  reasoningPoints: number;
  sentenceRangeScore: number;
  llmScore: number;
  total: number;
}

/**
 * S_accuracy = (V_match × 2,500) + (D_match × 2,500) + (R_llm × 5,000)
 */
export function computeAccuracyScore(
  caseRow: Case,
  playerVerdict: string,
  playerSentenceText: string,
  playerSentenceNumeric: number | null | undefined,
  llmNormalized: number,
): AccuracyParts {
  const V = verdictMatches(playerVerdict, caseRow.correctVerdict) ? 1 : 0;
  const D = sentenceRangeScore(
    playerSentenceNumeric,
    caseRow.correctSentenceNumeric,
    playerSentenceText,
    caseRow.correctSentenceText,
  );
  const R = Math.min(1, Math.max(0, llmNormalized));

  return {
    verdictMatch: V === 1,
    verdictPoints: V * 2500,
    damagesPoints: Math.round(D * 2500),
    reasoningPoints: Math.round(R * 5000),
    sentenceRangeScore: D,
    llmScore: R,
    total: V * 2500 + Math.round(D * 2500) + Math.round(R * 5000),
  };
}
