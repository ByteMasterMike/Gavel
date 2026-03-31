"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      : Math.min(
          100,
          (me.careerPoints / nextFloor) * 100,
        );

  const accuracyLabel =
    me.rollingVerdictRate === null
      ? "—"
      : `${(me.rollingVerdictRate * 100).toFixed(0)}%`;

  const verdicts = me.scoredRulingsCount ?? 0;

  return (
    <Card className="border-primary/35 bg-card/80 shadow-[0_0_0_1px_oklch(0.72_0.11_85_/_12%)]">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg tracking-tight text-primary">Current standing</CardTitle>
        <CardDescription className="text-muted-foreground">Career points, streak, and accuracy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-heading text-3xl font-semibold tabular-nums text-foreground">
              {me.careerPoints.toLocaleString()}{" "}
              <span className="text-lg font-normal text-primary">CP</span>
            </p>
            <p className="mt-1 inline-flex rounded border border-primary/40 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-primary">
              Tier {me.currentTier} · {me.tierTitle}
            </p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs uppercase text-muted-foreground">
            <span>Daily streak</span>
            <span className="tabular-nums text-foreground">{me.streakDays} day(s)</span>
          </div>
          <Progress className="mt-2 h-2 bg-muted" value={Math.min(100, me.streakDays * 10)} />
          <p className="mt-1 text-xs text-muted-foreground">Morning Docket · consecutive local days</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Verdicts</p>
            <p className="font-heading text-2xl font-semibold tabular-nums">{verdicts}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Accuracy</p>
            <p className="font-heading text-2xl font-semibold tabular-nums">{accuracyLabel}</p>
            <p className="text-[10px] text-muted-foreground">Last 10 scored</p>
          </div>
        </div>
        {(me.morningGavelCount ?? 0) > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Gavel className="size-4 shrink-0" />
              Morning Gavel · top 10 daily
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Earned <span className="font-medium text-foreground">{me.morningGavelCount}</span> time
              {me.morningGavelCount === 1 ? "" : "s"} on your local board.
            </p>
            {me.morningGavelBadges && me.morningGavelBadges.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {me.morningGavelBadges.slice(0, 3).map((b) => (
                  <li key={b.id} className="flex justify-between gap-2">
                    <span className="truncate">{b.caseTitle ?? "Docket case"}</span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      #{b.rank} · {b.totalScore.toLocaleString()} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {me.pointsToNextTier !== null && nextFloor !== null ? (
          <div>
            <p className="text-xs text-muted-foreground">
              Next tier floor {nextFloor.toLocaleString()} pts · {me.pointsToNextTier.toLocaleString()} to go
            </p>
            <Progress className="mt-2 h-1.5" value={progressPct} />
          </div>
        ) : null}
        {me.tierAccuracyWarning ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            Your recent verdict accuracy is below your rank. Improve your rolling match rate or you may be
            demoted after repeated rulings.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
