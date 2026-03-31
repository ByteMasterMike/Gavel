import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { userHasActiveSubscription } from "@/lib/subscription";

/** USD per 1M input tokens (override via env). */
export function anthropicInputUsdPerMillion(): number {
  const v = parseFloat(process.env.ANTHROPIC_INPUT_USD_PER_MTOK ?? "3");
  return Number.isFinite(v) && v >= 0 ? v : 3;
}

/** USD per 1M output tokens (override via env). */
export function anthropicOutputUsdPerMillion(): number {
  const v = parseFloat(process.env.ANTHROPIC_OUTPUT_USD_PER_MTOK ?? "15");
  return Number.isFinite(v) && v >= 0 ? v : 15;
}

export function estimateCallCostUsd(inputTokens: number, outputTokens: number): number {
  const inCost = (inputTokens / 1_000_000) * anthropicInputUsdPerMillion();
  const outCost = (outputTokens / 1_000_000) * anthropicOutputUsdPerMillion();
  return Math.round((inCost + outCost) * 1_000_000) / 1_000_000;
}

/** Calendar month bounds in UTC (aligns with typical billing reset on 1st UTC). */
export function utcMonthBounds(ref: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

export async function getMonthLlmSpendUsd(userId: string, ref: Date = new Date()): Promise<number> {
  const { start, end } = utcMonthBounds(ref);
  const agg = await prisma.llmUsageLog.aggregate({
    where: { userId, createdAt: { gte: start, lt: end } },
    _sum: { estimatedCostUsd: true },
  });
  return agg._sum.estimatedCostUsd ?? 0;
}

/**
 * Monthly LLM budget (USD): half of subscription price when subscribed; otherwise free-tier cap from env.
 */
export function getUserMonthlyLlmBudgetUsd(user: Pick<User, "subscriptionStatus" | "subscriptionValidUntil">): number {
  if (userHasActiveSubscription(user)) {
    const monthly = parseFloat(process.env.SUBSCRIPTION_MONTHLY_USD ?? "9.99");
    const safe = Number.isFinite(monthly) && monthly > 0 ? monthly : 9.99;
    return safe * 0.5;
  }
  const free = parseFloat(process.env.FREE_MONTHLY_LLM_BUDGET_USD ?? "0.10");
  return Number.isFinite(free) && free >= 0 ? free : 0.1;
}

export async function shouldDegradeLlmScoring(
  user: User,
  caseId: string,
  todaysDailyCaseId: string | null,
): Promise<boolean> {
  if (todaysDailyCaseId && caseId === todaysDailyCaseId) return false;
  const budget = getUserMonthlyLlmBudgetUsd(user);
  const spent = await getMonthLlmSpendUsd(user.id);
  return spent >= budget;
}

export const DEGRADED_LLM_MESSAGE =
  "Detailed reasoning feedback was unavailable — monthly evaluation budget reached. Your score used verdict and remedy matching only for the reasoning portion.";
