"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { TIER_POINT_FLOORS } from "@/lib/careerTier";
import { Gavel } from "lucide-react";

type Me = {
  careerPoints: number;
  currentTier: number;
  streakDays: number;
  tierTitle: string;
  tierAccuracyWarning: boolean;
  rollingVerdictRate: number | null;
  pointsToNextTier: number | null;
  scoredRulingsCount?: number;
  morningGavelCount?: number;
  morningGavelBadges?: {
    id: string;
    localDateYmd: string;
    rank: number;
    totalScore: number;
    caseTitle: string | null;
  }[];
};

export function CareerSection() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/me");
      if (!res.ok || cancelled) return;
      const j = (await res.json()) as { user: Me | null };
      if (!cancelled) setMe(j.user);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me) return null;

  const nextFloor =
    me.currentTier < 5 ? TIER_POINT_FLOORS[me.currentTier] : null;
  const progressPct =
    nextFloor === null
      ? 100
      : Math.min(100, (me.careerPoints / nextFloor) * 100);

  const streakBarPct = Math.min(100, Math.max(8, me.streakDays * 15));

  const accuracyLabel =
    me.rollingVerdictRate === null
      ? "—"
      : `${(me.rollingVerdictRate * 100).toFixed(0)}%`;

  const verdicts = me.scoredRulingsCount ?? 0;

  const masteryNote =
    me.pointsToNextTier !== null && nextFloor !== null
      ? `Mastery in progress. ${me.pointsToNextTier.toLocaleString()} CP until next rank promotion.`
      : "You’ve reached the top tier floor for this season.";

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-lg bg-[#201f1f] p-8 gold-leaf-border">
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[#e9c176]/5 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#d1c5b4]/50">Current standing</span>
          <h2 className="mt-1 font-heading text-3xl font-bold text-[#e9c176]">
            {me.careerPoints.toLocaleString()}{" "}
            <span className="text-sm font-normal uppercase tracking-widest text-[#d1c5b4]/70">CP</span>
          </h2>
        </div>
        <div className="shrink-0 rounded border border-[#e9c176]/20 bg-[#e9c176]/10 px-3 py-1">
          <span className="font-label text-[10px] font-bold uppercase text-[#e9c176]">Tier {me.currentTier}</span>
        </div>
      </div>
      <p className="relative -mt-2 font-heading text-sm font-medium text-[#d1c5b4]/80">{me.tierTitle}</p>

      <div className="relative space-y-2">
        <div className="flex justify-between font-label text-[10px] uppercase tracking-widest text-[#d1c5b4]">
          <span>Daily streak</span>
          <span className="font-bold text-[#e9c176]">
            {me.streakDays} {me.streakDays === 1 ? "Day" : "Days"}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#353534]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#e9c176] to-[#c5a059] shadow-[0_0_10px_rgba(233,193,118,0.4)]"
            style={{ width: `${streakBarPct}%` }}
          />
        </div>
        <p className="font-label text-[9px] italic text-[#d1c5b4]/40">{masteryNote}</p>
      </div>

      <div className="relative grid grid-cols-2 gap-4 border-t border-[#4e4639]/30 pt-4">
        <div className="text-center">
          <span className="block font-heading text-xl text-[#e5e2e1]">{verdicts}</span>
          <span className="font-label text-[9px] uppercase tracking-widest text-[#d1c5b4]/60">Verdicts</span>
        </div>
        <div className="text-center">
          <span className="block font-heading text-xl text-[#e5e2e1]">{accuracyLabel}</span>
          <span className="font-label text-[9px] uppercase tracking-widest text-[#d1c5b4]/60">Accuracy</span>
        </div>
      </div>

      {(me.morningGavelCount ?? 0) > 0 && (
        <div className="relative rounded-lg border border-[#e9c176]/30 bg-[#e9c176]/5 px-3 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#e9c176]">
            <Gavel className="size-4 shrink-0" />
            Morning Gavel · top 10 daily
          </div>
          <p className="mt-1 font-body text-xs text-[#d1c5b4]">
            Earned <span className="font-medium text-[#e5e2e1]">{me.morningGavelCount}</span> time
            {me.morningGavelCount === 1 ? "" : "s"} on your local board.
          </p>
          {me.morningGavelBadges && me.morningGavelBadges.length > 0 && (
            <ul className="mt-2 space-y-1 font-label text-xs text-[#d1c5b4]">
              {me.morningGavelBadges.slice(0, 3).map((b) => (
                <li key={b.id} className="flex justify-between gap-2">
                  <span className="truncate">{b.caseTitle ?? "Docket case"}</span>
                  <span className="shrink-0 tabular-nums text-[#e5e2e1]">
                    #{b.rank} · {b.totalScore.toLocaleString()} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {nextFloor !== null ? (
        <div className="relative">
          <p className="font-label text-[10px] text-[#d1c5b4]/60">
            Progress to tier floor {nextFloor.toLocaleString()} pts
          </p>
          <Progress className="mt-2 h-1.5 bg-[#353534]" value={progressPct} />
        </div>
      ) : null}

      {me.tierAccuracyWarning ? (
        <div className="relative rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-body text-sm text-amber-100">
          Your recent verdict accuracy is below your rank. Improve your rolling match rate or you may be demoted after
          repeated rulings.
        </div>
      ) : null}
    </div>
  );
}
