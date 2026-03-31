"use client";

import type { ReactNode } from "react";
import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CaseKind } from "@/types";

export type RevealPayload = {
  title: string;
  kind: CaseKind;
  correctVerdict: string;
  correctSentenceText: string;
  correctSentenceNumeric: number | null;
  actualOpinionExcerpt: string;
  whyExplanation: string;
  isOverturned: boolean;
  appellateReversalSummary: string | null;
};

export type PrescientReveal = {
  points: number;
  debatePrompt: string | null;
};

type PlayerRuling = {
  verdict: string;
  sentenceText: string;
  sentenceNumeric: number | null;
  findingsOfFact: string;
  applicationOfLaw: string;
  mitigatingFactors: string;
};

type Props = {
  player: PlayerRuling;
  reveal: RevealPayload;
  /** Shown after scoring when Prescient Justice bonuses applied. */
  prescientJustice?: PrescientReveal | null;
};

function Stagger({ delayMs, children }: { delayMs: number; children: ReactNode }) {
  return (
    <div className="gavel-reveal-stagger" style={{ animationDelay: `${delayMs}ms` }}>
      {children}
    </div>
  );
}

export function RevealScreen({ player, reveal, prescientJustice }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-primary lg:hidden">
        <Scale className="size-7" />
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">The reveal</h2>
          <p className="text-xs text-muted-foreground">{reveal.title}</p>
        </div>
      </div>

      <Stagger delayMs={0}>
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
          The Gavel is an educational game. Nothing here constitutes legal advice. Content is for
          educational and entertainment purposes only.
        </p>
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <Stagger delayMs={80}>
        <Card className="border-primary/35 bg-gradient-to-br from-card via-[color-mix(in_oklab,var(--judicial-panel)_35%,transparent)] to-accent/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Your decision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">
                {reveal.kind === "CRIMINAL" ? "Verdict: " : "Liability: "}
              </span>
              <span className="font-semibold">{player.verdict.replaceAll("_", " ")}</span>
            </p>
            <p className="whitespace-pre-wrap">{player.sentenceText}</p>
            <Separator />
            <p className="text-xs font-medium uppercase text-muted-foreground">Findings of fact</p>
            <p className="whitespace-pre-wrap text-muted-foreground">{player.findingsOfFact}</p>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {reveal.kind === "CRIMINAL" ? "Application of law" : "Legal analysis"}
            </p>
            <p className="whitespace-pre-wrap text-muted-foreground">{player.applicationOfLaw}</p>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {reveal.kind === "CRIMINAL" ? "Mitigating / aggravating" : "Basis for remedy"}
            </p>
            <p className="whitespace-pre-wrap text-muted-foreground">{player.mitigatingFactors}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-card/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Trial outcome (scored)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Outcome: </span>
              <span className="font-semibold">{reveal.correctVerdict.replaceAll("_", " ")}</span>
            </p>
            <p className="whitespace-pre-wrap">{reveal.correctSentenceText}</p>
            <Separator />
            <p className="whitespace-pre-wrap leading-relaxed">{reveal.actualOpinionExcerpt}</p>
          </CardContent>
        </Card>
        </Stagger>
      </div>

      {reveal.isOverturned && reveal.appellateReversalSummary && (
        <Stagger delayMs={280}>
        <Card className="border-violet-500/40 bg-violet-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Later overturned on appeal</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="whitespace-pre-wrap">{reveal.appellateReversalSummary}</p>
            <p className="mt-3 text-foreground">
              You were scored against the trial court outcome — the standard for this historical
              seat.
            </p>
          </CardContent>
        </Card>
        </Stagger>
      )}

      {reveal.isOverturned && (
        <Stagger delayMs={360}>
        <Card className="border-sky-500/35 bg-sky-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Debate prompt</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            <p className="text-foreground">
              A higher court later disagreed with the trial outcome you were scored against. Which
              ruling do you think was better grounded in the record as you saw it, and why? (There is
              no wrong answer — this is for your own reflection or class discussion.)
            </p>
          </CardContent>
        </Card>
        </Stagger>
      )}

      {prescientJustice && prescientJustice.points > 0 && prescientJustice.debatePrompt && (
        <Stagger delayMs={420}>
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Prescient Justice — +{prescientJustice.points} pts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground">
              History moved after the trial you just sat. Part of your ruling anticipated where a
              later panel pushed the case — that foresight earns a separate bonus on top of trial
              scoring.
            </p>
            <div>
              <p className="text-xs font-medium uppercase text-emerald-200/90">Debate prompt</p>
              <p className="mt-1 leading-relaxed">{prescientJustice.debatePrompt}</p>
            </div>
          </CardContent>
        </Card>
        </Stagger>
      )}

      <Stagger delayMs={500}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Why (plain English)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            <p className="whitespace-pre-wrap">{reveal.whyExplanation}</p>
          </CardContent>
        </Card>
      </Stagger>
    </div>
  );
}
