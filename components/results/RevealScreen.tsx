"use client";

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
};

export function RevealScreen({ player, reveal }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary">
        <Scale className="size-8" />
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">The reveal</h2>
          <p className="text-sm text-muted-foreground">{reveal.title}</p>
        </div>
      </div>

      <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
        The Gavel is an educational game. Nothing here constitutes legal advice. Content is for
        educational and entertainment purposes only.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">Your ruling</CardTitle>
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

        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actual ruling</CardTitle>
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
      </div>

      {reveal.isOverturned && reveal.appellateReversalSummary && (
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
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Why (plain English)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          <p className="whitespace-pre-wrap">{reveal.whyExplanation}</p>
        </CardContent>
      </Card>
    </div>
  );
}
