"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Award, Brain, Flame, Share2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { RevealScreen, type RevealPayload } from "@/components/results/RevealScreen";
import { ScoreBreakdown } from "@/components/results/ScoreBreakdown";
import type { ScoreBreakdownPayload } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarResults } from "@/components/shell/AppSidebar";

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
  const [shareCopied, setShareCopied] = useState(false);
  const [analysisUnlocked, setAnalysisUnlocked] = useState(false);

  useEffect(() => {
    setAnalysisUnlocked(false);
  }, [rulingId]);

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
    return (
      <JudicialShell sidebar={<AppSidebarResults />}>
        <p className="p-8 text-center text-muted-foreground">Loading…</p>
      </JudicialShell>
    );
  }

  if (error || !data) {
    return (
      <JudicialShell sidebar={<AppSidebarResults />}>
        <p className="p-8 text-center text-destructive" role="alert">
          {error ?? "Loading results…"}
        </p>
      </JudicialShell>
    );
  }

  const pending = data.ruling.status !== "SCORED";
  const prescientPts = data.ruling.scoreBreakdown?.accuracy.prescientJustice?.points ?? 0;

  const buildSpoilerFreeShareText = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/results/${rulingId}`;
    const rank = data.ruling.judgeRank?.trim() || "Judge";
    const pts = data.ruling.totalScore;
    const day = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const scoreLine =
      pts != null ? `${pts.toLocaleString()} pts` : "Scored";
    return `Gavel · ${day}\n${rank} · ${scoreLine}\n${url}`;
  };

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(buildSpoilerFreeShareText());
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      setShareCopied(false);
    }
  };
  const headline = data.reveal.isOverturned ? "The overturned reveal" : "Case reveal";
  const accuracyPct =
    data.ruling.scoreBreakdown && data.ruling.scoreBreakdown.accuracy.total > 0
      ? Math.min(
          100,
          Math.round(
            (data.ruling.scoreBreakdown.accuracy.reasoningPoints / 5000) * 100,
          ),
        )
      : null;

  const main = (
    <div className="px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Docket record · case closed
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {headline}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{data.reveal.title}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {prescientPts > 0 && !pending && (
              <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2">
                <Award className="size-5 text-primary" />
                <div className="text-right text-xs">
                  <p className="font-semibold uppercase tracking-wide text-primary">Award granted</p>
                  <p className="text-foreground">Prescient Justice · +{prescientPts} pts</p>
                </div>
              </div>
            )}
            {pending && (
              <p className="text-sm text-muted-foreground animate-pulse">Deliberating… scoring your ruling</p>
            )}
          </div>
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

        {!pending && data.ruling.scoreBreakdown && !analysisUnlocked && (
          <div className="flex flex-col items-center gap-2 border-y border-border/60 py-8">
            <Button type="button" size="lg" className="min-w-[240px]" onClick={() => setAnalysisUnlocked(true)}>
              Continue to juridical analysis
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Take a beat before scores and feedback — same reveal, paced delivery.
            </p>
          </div>
        )}

        {!pending && data.ruling.scoreBreakdown && analysisUnlocked && (
          <>
            <section className="space-y-4">
              <h2 className="font-heading text-xl text-foreground">Juridical analysis</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-primary/25 bg-card/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Brain className="size-4 text-primary" />
                      Reasoning alignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {data.ruling.llmFeedback ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{data.ruling.llmFeedback}</p>
                    ) : (
                      <p>Evaluation summary will appear when the model returns feedback.</p>
                    )}
                    {accuracyPct !== null && (
                      <p className="mt-3 text-xs text-foreground">
                        Reasoning score index ~{accuracyPct}% of band (LLM component of accuracy).
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border bg-card/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Flame className="size-4 text-primary" />
                      Score snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Verdict match:{" "}
                      <span className="font-medium text-foreground">
                        {data.ruling.scoreBreakdown.accuracy.verdictMatch ? "Yes" : "No"}
                      </span>
                    </p>
                    <p>
                      Style total:{" "}
                      <span className="font-medium text-foreground">
                        {data.ruling.scoreBreakdown.style.total.toLocaleString()}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Card className="border-primary/40 bg-gradient-to-br from-primary/15 via-card to-transparent">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-foreground">{data.ruling.judgeRank}</CardTitle>
                <p className="text-sm text-muted-foreground">{data.ruling.judgeRankDescription}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary">Case XP earned</p>
                  <p className="font-heading text-4xl font-semibold tabular-nums text-primary">
                    +{data.ruling.totalScore?.toLocaleString() ?? "—"}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-primary/50 gap-2"
                    onClick={() => void copyShareText()}
                  >
                    <Share2 className="size-4" />
                    {shareCopied ? "Copied" : "Copy share text"}
                  </Button>
                  <p className="text-center text-[10px] text-muted-foreground sm:text-right">
                    Spoiler-free: rank, points, date, link — no verdict or outcome.
                  </p>
                  <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "border-primary/50 shrink-0")}>
                    Archive case file
                  </Link>
                </div>
              </CardContent>
            </Card>

            <ScoreBreakdown key={rulingId} breakdown={data.ruling.scoreBreakdown} />
          </>
        )}

        <Link href="/" className={cn(buttonVariants(), "inline-flex")}>
          Return to docket
        </Link>
      </div>
    </div>
  );

  return <JudicialShell sidebar={<AppSidebarResults />}>{main}</JudicialShell>;
}
