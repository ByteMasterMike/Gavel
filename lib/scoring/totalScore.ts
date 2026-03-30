import type { JudgeRankResult } from "@/types";

export function tierMultiplier(tier: number): number {
  if (tier <= 1) return 1;
  if (tier === 2) return 1.5;
  if (tier === 3) return 2.5;
  if (tier === 4) return 2.5;
  return 4;
}

export function streakBonus(streakDays: number): number {
  if (streakDays >= 30) return 3500;
  if (streakDays >= 14) return 2000;
  if (streakDays >= 7) return 1000;
  if (streakDays >= 3) return 500;
  return 0;
}

export function indecisionPenalty(verdictFlips: number): number {
  // PRD: penalty applies when user flips verdict repeatedly; we charge per flip count reported by client.
  return 500 * Math.max(0, verdictFlips);
}

export function computeWeightedTrialScore(
  accuracyTotal: number,
  styleTotal: number,
  streak: number,
  indecision: number,
): number {
  const sub = accuracyTotal * 0.6 + styleTotal * 0.4 + streak - indecision;
  return Math.max(0, Math.round(sub));
}

export function judgeRank(
  finalTotal: number,
  opts: {
    verdictMatch: boolean;
    styleTotal: number;
    accuracyTotal: number;
    tier: number;
    hintsUsed: number;
    elapsedMin: number;
    parMinutes: number;
  },
): JudgeRankResult {
  const { verdictMatch, styleTotal, accuracyTotal, tier, hintsUsed, elapsedMin, parMinutes } =
    opts;

  if (verdictMatch && styleTotal < 2000) {
    return {
      key: "stopped_clock",
      title: "The Stopped Clock",
      description: "Right twice a day. Today was your day.",
    };
  }
  if (!verdictMatch && styleTotal > 9000) {
    return {
      key: "wrongly_elegant",
      title: "The Wrongly Elegant",
      description: "Beautifully argued. Completely wrong.",
    };
  }
  if (tier >= 4 && hintsUsed === 0) {
    return {
      key: "self_made_jurist",
      title: "The Self-Made Jurist",
      description: "Didn't need us. We noticed.",
    };
  }
  if (elapsedMin <= parMinutes / 2 && accuracyTotal / 10000 >= 0.85) {
    return {
      key: "expedient",
      title: "The Expedient",
      description: "Justice is served, and so is the next case.",
    };
  }

  if (finalTotal < 1000)
    return {
      key: "recused",
      title: "The Recused",
      description: "You were asked to leave the bench. Permanently.",
    };
  if (finalTotal < 3000)
    return {
      key: "night_court",
      title: "Night Court Understudy",
      description: "You technically showed up. That's about it.",
    };
  if (finalTotal < 5000)
    return {
      key: "ambulance_chaser",
      title: "The Ambulance Chaser",
      description: "Bold of you to call this a ruling.",
    };
  if (finalTotal < 6500)
    return {
      key: "hung_jury",
      title: "Hung Jury",
      description: "The jury is still out. On you.",
    };
  if (finalTotal < 7500)
    return {
      key: "junior_associate",
      title: "Junior Associate",
      description: "Promising. In the way that a first draft is promising.",
    };
  if (finalTotal < 8250)
    return {
      key: "competent",
      title: "The Competent",
      description: "Solid work. No one will remember it, but still.",
    };
  if (finalTotal < 9000)
    return {
      key: "honorable_mention",
      title: "Honorable Mention",
      description: "Your Honor would be appropriate here.",
    };
  if (finalTotal < 9500)
    return {
      key: "shareholder_value",
      title: "The Shareholder Value",
      description: "Efficient, precise, and slightly terrifying.",
    };
  if (finalTotal < 9800)
    return {
      key: "textualist",
      title: "The Textualist",
      description: "Four clerks, two clerks, or none — you didn't need them.",
    };
  if (finalTotal < 10000)
    return {
      key: "dissenter",
      title: "The Dissenter",
      description: "You didn't agree with history. History may catch up.",
    };
  return {
    key: "perfect_gavel",
    title: "Perfect Gavel",
    description: "The only honest verdict. Frame this.",
  };
}
