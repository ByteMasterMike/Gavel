import { PRD_IMPLEMENTATION_TRACK } from "@/lib/prd/track";
import { getUtcTodayDailyCaseId } from "@/lib/dailyPolicy";
import { prisma } from "@/lib/prisma";
import type { SubscriptionFields } from "@/lib/subscription";
import { userHasActiveSubscription } from "@/lib/subscription";

/** Re-export for diagnostics / admin; active PRD build track. */
export const prdActiveImplementationTrack = PRD_IMPLEMENTATION_TRACK;

export async function getTodaysDailyCaseId(): Promise<string | null> {
  return getUtcTodayDailyCaseId();
}

export async function getUserSubscriptionFields(userId: string): Promise<SubscriptionFields> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true, subscriptionValidUntil: true },
  });
  return {
    subscriptionStatus: row?.subscriptionStatus ?? "NONE",
    subscriptionValidUntil: row?.subscriptionValidUntil ?? null,
  };
}

export type CaseAccessFields = {
  id: string;
  tier: number;
  requiresSubscription: boolean;
};

export type CaseAccessResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; message: string };

/**
 * Gates: career tier for core catalog; subscriber-only cases need an active subscription;
 * Morning Docket always allowed (including tier bypass).
 */
export function evaluateCaseAccess(input: {
  sessionUserId: string | null;
  userTier: number;
  subscription: SubscriptionFields;
  caseRow: CaseAccessFields;
  todaysDailyCaseId: string | null;
  /** When set and equal to this case id, a joined class session unlocks play regardless of tier/subscription. */
  classroomSessionCaseId?: string | null;
}): CaseAccessResult {
  const { sessionUserId, userTier, subscription, caseRow, todaysDailyCaseId } = input;

  const isMorningDocket = todaysDailyCaseId != null && caseRow.id === todaysDailyCaseId;
  if (isMorningDocket) {
    return { ok: true };
  }

  if (
    input.classroomSessionCaseId != null &&
    input.classroomSessionCaseId === caseRow.id
  ) {
    return { ok: true };
  }

  const subscribed = userHasActiveSubscription(subscription);

  if (!sessionUserId) {
    if (caseRow.requiresSubscription) {
      return { ok: false, status: 403, message: "Sign in and subscribe to access this case." };
    }
    if (caseRow.tier > 1) {
      return { ok: false, status: 403, message: "Sign in to access cases above your preview tier." };
    }
    return { ok: true };
  }

  if (caseRow.requiresSubscription && !subscribed) {
    return {
      ok: false,
      status: 403,
      message: "This case is part of the subscriber library. Subscribe to unlock.",
    };
  }

  if (caseRow.tier > userTier) {
    return {
      ok: false,
      status: 403,
      message: "Your current seat has not reached this tier. Keep ruling to advance.",
    };
  }

  return { ok: true };
}
