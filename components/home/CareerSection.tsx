"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Me = {
  careerPoints: number;
  currentTier: number;
  streakDays: number;
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

  const tierGoal = [0, 10_000, 40_000, 120_000, 350_000][me.currentTier] ?? 10_000;
  const tierProgress = Math.min(100, (me.careerPoints / tierGoal) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Career</CardTitle>
        <CardDescription>Streak and cumulative points (MVP)</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Streak</p>
          <p className="text-2xl font-bold">{me.streakDays} days</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Career points</p>
          <p className="text-2xl font-bold">{me.careerPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Tier {me.currentTier} progress (illustrative)</p>
          <Progress className="mt-2 h-2" value={tierProgress} />
        </div>
      </CardContent>
    </Card>
  );
}
