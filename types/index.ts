import type { CaseKind, RulingStatus } from "@prisma/client";

export type { CaseKind, RulingStatus };

/** Phase index for the gameplay shell (0–4). Reveal is results page, not a phase here. */
export type GamePhase = "briefing" | "evidence" | "library" | "ruling";

export const GAME_PHASES: GamePhase[] = ["briefing", "evidence", "library", "ruling"];

export interface PublicCaseDocument {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
}

export interface PublicPrecedent {
  id: string;
  name: string;
  citation: string;
  summary: string;
  sortOrder: number;
}

export interface PublicCasePayload {
  id: string;
  title: string;
  tier: number;
  kind: CaseKind;
  category: string;
  briefSummary: string;
  parTimeMinutes: number;
  maxPrecedents: number;
  documents: PublicCaseDocument[];
  precedents: PublicPrecedent[];
}

export interface RulingSubmissionBody {
  caseId: string;
  verdict: string;
  sentenceText: string;
  sentenceNumeric?: number | null;
  findingsOfFact: string;
  applicationOfLaw: string;
  mitigatingFactors: string;
  flaggedDocIds: string[];
  starredDocIds: string[];
  citedPrecedentIds: string[];
  openedDocIds: string[];
  hintsUsed: number;
  verdictFlips: number;
  startedAt: string;
  submittedAt: string;
}

export interface ScoreBreakdownPayload {
  accuracy: {
    total: number;
    verdictMatch: boolean;
    verdictPoints: number;
    damagesPoints: number;
    reasoningPoints: number;
    sentenceRangeScore: number;
    llmScore: number;
  };
  style: {
    total: number;
    precedentRaw: number;
    objectionRaw: number;
    efficiencyRaw: number;
    speedRaw: number;
    precedentNorm: number;
    objectionNorm: number;
    efficiencyNorm: number;
    speedNorm: number;
  };
  streakBonus: number;
  indecisionPenalty: number;
  tierMultiplier: number;
  weightedSubtotal: number;
  finalTotal: number;
}

export interface JudgeRankResult {
  key: string;
  title: string;
  description: string;
}
