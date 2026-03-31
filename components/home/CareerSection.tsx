"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TIER_POINT_FLOORS } from "@/lib/careerTier";

type Me = {
  careerPoints: number;
  currentTier: number;
  streakDays: number;
  tierTitle: string;
  tierAccuracyWarning: boolean;
  rollingVerdictRate: number | null;
  pointsToNextTier: number | null;
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Career</CardTitle>
        <CardDescription>Streak, tier, and rolling verdict accuracy</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Streak</p>
          <p className="text-2xl font-bold">{me.streakDays} days</p>
          <p className="text-xs text-muted-foreground">Morning Docket (consecutive local days)</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Rolling accuracy</p>
          <p className="text-2xl font-bold">{accuracyLabel}</p>
          <p className="text-xs text-muted-foreground">Last 10 scored rulings (verdict match)</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs uppercase text-muted-foreground">Tier</p>
          <p className="text-lg font-semibold">{me.tierTitle}</p>
          {me.pointsToNextTier !== null && nextFloor !== null ? (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Progress to next tier ({nextFloor.toLocaleString()} pts):{" "}
                {me.pointsToNextTier.toLocaleString()} pts to go
              </p>
              <Progress className="mt-2 h-2" value={progressPct} />
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Top tier — no further point floor.</p>
          )}
        </div>
        {me.tierAccuracyWarning ? (
          <div className="sm:col-span-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            Your recent verdict accuracy is below your rank. Improve your rolling match rate or you
            may be demoted after repeated rulings.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
