import type { SubscriptionStatus } from "@prisma/client";

export type SubscriptionFields = {
  subscriptionStatus: SubscriptionStatus;
  subscriptionValidUntil: Date | null;
};

/**
 * Paid access: ACTIVE (optionally bounded by validUntil), or CANCELED/PAST_DUE still inside validUntil window.
 */
export function userHasActiveSubscription(user: SubscriptionFields): boolean {
  const now = Date.now();
  const until = user.subscriptionValidUntil?.getTime();

  if (user.subscriptionStatus === "ACTIVE") {
    if (until != null && until <= now) return false;
    return true;
  }

  if (user.subscriptionStatus === "CANCELED" || user.subscriptionStatus === "PAST_DUE") {
    return until != null && until > now;
  }

  return false;
}
