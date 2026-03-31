"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { RevealScreen, type RevealPayload } from "@/components/results/RevealScreen";
import { ScoreBreakdown } from "@/components/results/ScoreBreakdown";
import type { ScoreBreakdownPayload } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PollResponse = {
  ruling: {
    id: string;
    status: string;
    verdict: string;
    sentenceText: string;
    sentenceNumeric: number | null;
    findingsOfFact: string;
    applicationOfLaw: string;
    mitigatingFactors: string;
    totalScore: number | null;
    llmFeedback: string | null;
    scoreBreakdown: ScoreBreakdownPayload | null;
    judgeRank: string | null;
    judgeRankDescription: string | null;
  };
  reveal: RevealPayload;
};

export default function ResultsPage() {
  const params = useParams();
  const rulingId = params.rulingId as string;
  const { status } = useSession();
  const [data, setData] = useState<PollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      const res = await fetch(`/api/rulings/${rulingId}`);
      if (!res.ok) {
        if (!stop) setError("Could not load results.");
        return;
      }
      const j = (await res.json()) as PollResponse;
      if (!stop) {
        setData(j);
        setError(null);
        if (j.ruling.status === "SCORED" && intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    void tick();
    intervalId = setInterval(() => void tick(), 1200);
    return () => {
      stop = true;
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [rulingId]);

  if (status === "loading") {
    return <p className="text-center text-muted-foreground">Loading…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-center text-destructive" role="alert">
        {error ?? "Loading results…"}
      </p>
    );
  }

  const pending = data.ruling.status !== "SCORED";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
          ← Home
        </Link>
        {pending && (
          <p className="text-sm text-muted-foreground animate-pulse">Deliberating… scoring your ruling</p>
        )}
      </div>

      <RevealScreen
        player={{
          verdict: data.ruling.verdict,
          sentenceText: data.ruling.sentenceText,
          sentenceNumeric: data.ruling.sentenceNumeric,
          findingsOfFact: data.ruling.findingsOfFact,
          applicationOfLaw: data.ruling.applicationOfLaw,
          mitigatingFactors: data.ruling.mitigatingFactors,
        }}
        reveal={data.reveal}
        prescientJustice={
          data.ruling.scoreBreakdown?.accuracy.prescientJustice &&
          data.ruling.scoreBreakdown.accuracy.prescientJustice.points > 0
            ? {
                points: data.ruling.scoreBreakdown.accuracy.prescientJustice.points,
                debatePrompt: data.ruling.scoreBreakdown.accuracy.prescientJustice.debatePrompt,
              }
            : null
        }
      />

      {!pending && data.ruling.scoreBreakdown && (
        <>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">{data.ruling.judgeRank}</CardTitle>
              <p className="text-sm text-muted-foreground">{data.ruling.judgeRankDescription}</p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">
                {data.ruling.totalScore?.toLocaleString()} pts
              </p>
              {data.ruling.llmFeedback && (
                <p className="mt-3 text-sm text-muted-foreground">{data.ruling.llmFeedback}</p>
              )}
            </CardContent>
          </Card>
          <ScoreBreakdown key={rulingId} breakdown={data.ruling.scoreBreakdown} />
        </>
      )}

      <Link href="/" className={cn(buttonVariants(), "self-start")}>
        Return to docket
      </Link>
    </div>
  );
}
