/**
 * Active PRD implementation track (see gap analysis / product plan).
 * Access + catalog: subscription (not DLC packs); Stripe wiring can follow.
 */
export const PRD_IMPLEMENTATION_TRACK = "access-subscription" as const;

export type PrdImplementationTrack = typeof PRD_IMPLEMENTATION_TRACK;
