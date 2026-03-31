"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { ScoreBreakdownPayload } from "@/types";

type Props = {
  breakdown: ScoreBreakdownPayload;
  animate?: boolean;
};

export function ScoreBreakdown({ breakdown, animate = true }: Props) {
  const [step, setStep] = useState(0);
  const effectiveStep = !animate ? 99 : step;

  useEffect(() => {
    if (!animate) return;
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 900);
    const t3 = setTimeout(() => setStep(3), 1400);
    const t4 = setTimeout(() => setStep(99), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [animate]);

  const acc = breakdown.accuracy;
  const sty = breakdown.style;

  return (
    <div className="space-y-4">
      {effectiveStep >= 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Verdict match</span>
              <span className="font-medium">{acc.verdictMatch ? "Yes" : "No"}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Verdict points</span>
                <span>{acc.verdictPoints.toLocaleString()} / 2,500</span>
              </div>
              <Progress value={(acc.verdictPoints / 2500) * 100} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sentence / damages fit</span>
                <span>
                  {(acc.sentenceRangeScore * 100).toFixed(0)}% →{" "}
                  {acc.damagesPoints.toLocaleString()} pts
                </span>
              </div>
              <Progress value={acc.sentenceRangeScore * 100} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Reasoning (LLM)</span>
                <span>
                  {(acc.llmScore * 100).toFixed(0)}% → {acc.reasoningPoints.toLocaleString()} pts
                </span>
              </div>
              <Progress value={acc.llmScore * 100} />
            </div>
            {acc.prescientJustice && acc.prescientJustice.points > 0 && (
              <div className="rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prescient Justice</span>
                  <span className="font-medium text-violet-200">
                    +{acc.prescientJustice.points.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {acc.prescientJustice.verdictBonus && acc.prescientJustice.damagesBonus
                    ? "Outcome and remedy aligned with the later appellate record."
                    : acc.prescientJustice.verdictBonus
                      ? "Your verdict matched where the appeals court landed."
                      : "Your remedy sat closer to the appellate anchor than the trial award."}
                </p>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Accuracy total</span>
              <span>
                {acc.total.toLocaleString()}
                {acc.prescientJustice && acc.prescientJustice.points > 0 ? " pts" : " / 10,000"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {effectiveStep >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Style</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Precedents (40%)</p>
              <p className="font-medium">{sty.precedentNorm.toLocaleString()} norm</p>
              <p className="text-xs text-muted-foreground">raw {sty.precedentRaw}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Objections (30%)</p>
              <p className="font-medium">{sty.objectionNorm.toLocaleString()} norm</p>
              <p className="text-xs text-muted-foreground">raw {sty.objectionRaw}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Efficiency (20%)</p>
              <p className="font-medium">{sty.efficiencyNorm.toLocaleString()} norm</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Speed (10%)</p>
              <p className="font-medium">{sty.speedNorm.toLocaleString()} norm</p>
            </div>
            <div className="sm:col-span-2">
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Style total</span>
                <span>{sty.total.toLocaleString()} / 10,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {effectiveStep >= 3 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trial score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Streak bonus</span>
              <span>+{breakdown.streakBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indecision penalty</span>
              <span>−{breakdown.indecisionPenalty.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weighted subtotal</span>
              <span>{breakdown.weightedSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tier multiplier</span>
              <span>×{breakdown.tierMultiplier}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold tracking-tight">
              <span>Final total</span>
              <span>{breakdown.finalTotal.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
