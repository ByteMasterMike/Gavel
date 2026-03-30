"use client";

import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { EvidenceLocker } from "./EvidenceLocker";
import { LawLibrary } from "./LawLibrary";
import { RulingTemplate } from "./RulingTemplate";
import { useCaseSession } from "./CaseSessionContext";
import type { GamePhase, PublicCasePayload } from "@/types";
import { GAME_PHASES } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PHASE_LABEL: Record<GamePhase, string> = {
  briefing: "Briefing room",
  evidence: "Evidence locker",
  library: "Law library",
  ruling: "Your ruling",
};

export function CasePlayClient({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { state, loadCase, nextPhase, setPhase } = useCaseSession();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      const res = await fetch(`/api/cases/${caseId}`);
      if (!res.ok) {
        if (!cancelled) setLoadError("Case not found.");
        return;
      }
      const data = (await res.json()) as { case: PublicCasePayload };
      if (!cancelled) loadCase(data.case);
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, loadCase]);

  const submitRuling = useCallback(async () => {
    const form = document.getElementById("ruling-form") as HTMLFormElement | null;
    if (!form || !state.caseData || state.startedAt == null) return;
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const verdict = String(fd.get("verdict") ?? "");
    const sentenceText = String(fd.get("sentenceText") ?? "");
    const sn = fd.get("sentenceNumeric");
    const sentenceNumeric =
      sn === "" || sn === null ? null : Number(sn);
    const findingsOfFact = String(fd.get("findingsOfFact") ?? "");
    const applicationOfLaw = String(fd.get("applicationOfLaw") ?? "");
    const mitigatingFactors = String(fd.get("mitigatingFactors") ?? "");

    setSubmitting(true);
    try {
      const res = await fetch("/api/rulings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: state.caseData.id,
          verdict,
          sentenceText,
          sentenceNumeric: Number.isFinite(sentenceNumeric as number) ? sentenceNumeric : null,
          findingsOfFact,
          applicationOfLaw,
          mitigatingFactors,
          flaggedDocIds: Array.from(state.flaggedIds),
          starredDocIds: Array.from(state.starredIds),
          citedPrecedentIds: state.citedPrecedentIds,
          openedDocIds: Array.from(state.openedDocIds),
          hintsUsed: state.hintsUsed,
          verdictFlips: state.verdictFlips,
          startedAt: new Date(state.startedAt).toISOString(),
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = "Submit failed";
        try {
          const err = JSON.parse(text) as { error?: string };
          if (err.error) message = err.error;
        } catch {
          if (text.length > 0 && text.length < 200) message = text;
        }
        setLoadError(message);
        return;
      }
      const data = (await res.json()) as { rulingId: string };
      router.push(`/results/${data.rulingId}`);
    } finally {
      setSubmitting(false);
    }
  }, [router, state]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Sign in to play</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {process.env.NODE_ENV === "development" && (
            <Button type="button" onClick={() => signIn("dev", { callbackUrl: `/case/${caseId}` })}>
              Dev sign-in
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => signIn("google", { callbackUrl: `/case/${caseId}` })}>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <p className="text-center text-destructive" role="alert">
        {loadError}
      </p>
    );
  }

  if (!state.caseData) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading case file…
      </div>
    );
  }

  const c = state.caseData;
  const phaseIndex = GAME_PHASES.indexOf(state.phase);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-16">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Tier {c.tier}</Badge>
          <Badge variant="secondary">{c.kind === "CRIMINAL" ? "Criminal" : "Civil"}</Badge>
          <span className="text-sm text-muted-foreground">{c.category}</span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">{c.title}</h1>
        <nav className="flex flex-wrap gap-2" aria-label="Case phases">
          {GAME_PHASES.map((p, i) => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={p === state.phase ? "default" : "outline"}
              className={cn(i > phaseIndex && "opacity-60")}
              onClick={() => i <= phaseIndex && setPhase(p)}
              disabled={i > phaseIndex}
            >
              {i + 1}. {PHASE_LABEL[p]}
            </Button>
          ))}
        </nav>
      </header>

      {state.phase === "briefing" && (
        <Card>
          <CardHeader>
            <CardTitle>Case overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p className="text-base text-foreground">{c.briefSummary}</p>
            <p>
              Par time: <span className="font-medium text-foreground">{c.parTimeMinutes} min</span>{" "}
              (speed is a small style factor — take the time you need).
            </p>
            <Button type="button" onClick={() => nextPhase()}>
              Enter evidence locker
            </Button>
          </CardContent>
        </Card>
      )}

      {state.phase === "evidence" && (
        <div className="space-y-4">
          <EvidenceLocker />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPhase("briefing")}>
              Back
            </Button>
            <Button type="button" onClick={() => nextPhase()}>
              Continue to law library
            </Button>
          </div>
        </div>
      )}

      {state.phase === "library" && (
        <div className="space-y-4">
          <LawLibrary caseId={c.id} precedents={c.precedents} kind={c.kind} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPhase("evidence")}>
              Back
            </Button>
            <Button type="button" onClick={() => nextPhase()}>
              Draft ruling
            </Button>
          </div>
        </div>
      )}

      {state.phase === "ruling" && (
        <div className="space-y-4">
          <RulingTemplate kind={c.kind} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPhase("library")}>
              Back
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitRuling()}>
              {submitting ? "Submitting…" : "Submit ruling"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
