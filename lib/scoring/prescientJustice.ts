import type { Case } from "@prisma/client";
import { verdictMatches, sentenceRangeScore } from "@/lib/scoring/accuracyScore";

/** Bonus when the player matched the appellate outcome but not the trial verdict. */
export const PRESCIENT_VERDICT_BONUS = 1_500;

/** Bonus when numeric remedy is closer to the appellate anchor than the trial anchor. */
export const PRESCIENT_DAMAGES_BONUS = 900;

export type PrescientJusticeResult = {
  points: number;
  verdictBonus: boolean;
  damagesBonus: boolean;
  debatePrompt: string | null;
};

function appellateVerdictDiffersFromTrial(caseRow: Case): boolean {
  if (!caseRow.appellateCorrectVerdict) return false;
  return !verdictMatches(caseRow.correctVerdict, caseRow.appellateCorrectVerdict);
}

/**
 * On overturned cases, reward anticipating where a later panel landed — either on
 * outcome (when appellate verdict differs) or on damages when only the remedy moved.
 */
export function computePrescientJustice(
  caseRow: Case,
  playerVerdict: string,
  playerSentenceText: string,
  playerSentenceNumeric: number | null | undefined,
): PrescientJusticeResult {
  if (!caseRow.isOverturned) {
    return { points: 0, verdictBonus: false, damagesBonus: false, debatePrompt: null };
  }

  let points = 0;
  let verdictBonus = false;
  let damagesBonus = false;
  let debatePrompt: string | null = null;

  if (
    caseRow.appellateCorrectVerdict &&
    appellateVerdictDiffersFromTrial(caseRow) &&
    verdictMatches(playerVerdict, caseRow.appellateCorrectVerdict) &&
    !verdictMatches(playerVerdict, caseRow.correctVerdict)
  ) {
    verdictBonus = true;
    points += PRESCIENT_VERDICT_BONUS;
    debatePrompt =
      "The trial court and a later appellate panel disagreed on the bottom-line outcome. Which approach better fits the record you saw, and what would you tell a new jurist about living with that tension?";
  }

  const trialN = caseRow.correctSentenceNumeric;
  const appN = caseRow.appellateCorrectSentenceNumeric;

  if (
    trialN != null &&
    appN != null &&
    Number.isFinite(trialN) &&
    Number.isFinite(appN) &&
    trialN !== appN
  ) {
    const towardTrial = sentenceRangeScore(
      playerSentenceNumeric,
      trialN,
      playerSentenceText,
      caseRow.correctSentenceText,
    );
    const towardApp = sentenceRangeScore(
      playerSentenceNumeric,
      appN,
      playerSentenceText,
      caseRow.correctSentenceText,
    );
    if (towardApp > towardTrial) {
      damagesBonus = true;
      points += PRESCIENT_DAMAGES_BONUS;
      if (!debatePrompt) {
        debatePrompt =
          "On appeal, the remedy was recalibrated. When should a trial court foreground expert mitigation testimony early — and when is a remand the right signal instead of a single shot at the full amount?";
      }
    }
  }

  if (verdictBonus && damagesBonus) {
    debatePrompt =
      "You anticipated both the appellate outcome and a narrower remedy than the trial award. Where should trial courts draw the line between finality and getting damages right the first time?";
  }

  return { points, verdictBonus, damagesBonus, debatePrompt };
}
