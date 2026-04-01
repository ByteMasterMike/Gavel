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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarHome, AppSidebarTrial } from "@/components/shell/AppSidebar";
import Link from "next/link";

const PHASE_LABEL: Record<GamePhase, string> = {
  briefing: "Briefing room",
  evidence: "Evidence locker",
  library: "Law library",
  ruling: "Your ruling",
};

/** When mobile + desktop legal pads both mount, only one is visible; submit must use that form. */
function getVisibleRulingForm(doc: Document): HTMLFormElement | null {
  const forms = doc.querySelectorAll<HTMLFormElement>("form[data-ruling-form]");
  for (const form of forms) {
    if (typeof form.checkVisibility === "function") {
      try {
        if (form.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return form;
      } catch {
        /* ignore */
      }
    }
    if (form.offsetParent !== null) return form;
    const rects = form.getClientRects();
    if (rects.length > 0 && rects[0]!.width > 0 && rects[0]!.height > 0) return form;
  }
  return forms[0] ?? null;
}

function LegalPadPanel({
  kind,
  appellateSeat,
  phase,
  submitting,
  onSubmit,
  onBack,
  layout = "rail",
}: {
  kind: PublicCasePayload["kind"];
  appellateSeat: boolean;
  phase: GamePhase;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
  /** `center` = main column (ruling); `rail` = narrow right sidebar. */
  layout?: "rail" | "center";
}) {
  if (phase !== "ruling") {
    return (
      <div
        className={cn(
          "flex h-full flex-col border-border bg-card/95 p-5 shadow-inner",
          layout === "rail" && "xl:border-l",
        )}
      >
        <div className="mb-4">
          <h2 className="font-heading text-lg text-foreground">Virtual Legal Pad</h2>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Drafting preliminary verdict</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete evidence, library, and briefing steps. Your ruling draft unlocks in the final phase.
        </p>
        <div className="mt-6 rounded-lg border border-dashed border-primary/30 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          Locked until &ldquo;Prior rulings&rdquo; phase
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto border-border bg-card/95 p-5 xl:border-l">
      <div>
        <h2 className="font-heading text-lg text-foreground">Virtual Legal Pad</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Drafting preliminary verdict</p>
      </div>
      <RulingTemplate kind={kind} appellateSeat={appellateSeat} className="max-w-none space-y-5" />
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <Button type="button" className="w-full" disabled={submitting} onClick={() => void onSubmit()}>
          {submitting ? "Submitting…" : "Finalize decision"}
        </Button>
        <Button type="button" variant="ghost" className="w-full text-muted-foreground" disabled>
          Save draft
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          Back to library
        </Button>
      </div>
    </div>
  );
}

export function CasePlayClient({
  caseId,
  classSessionId = null,
}: {
  caseId: string;
  classSessionId?: string | null;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { state, loadCase, nextPhase, setPhase } = useCaseSession();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      const qs =
        classSessionId != null && classSessionId !== ""
          ? `?sessionId=${encodeURIComponent(classSessionId)}`
          : "";
      const res = await fetch(`/api/cases/${caseId}${qs}`);
      if (!res.ok) {
        let message = res.status === 403 ? "You do not have access to this case." : "Case not found.";
        try {
          const raw = await res.text();
          const err = JSON.parse(raw) as { error?: string };
          if (err.error) message = err.error;
        } catch {
          /* keep default */
        }
        if (!cancelled) setLoadError(message);
        return;
      }
      const data = (await res.json()) as { case: PublicCasePayload };
      if (!cancelled) loadCase(data.case);
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, classSessionId, loadCase]);

  const submitRuling = useCallback(async () => {
    setLoadError(null);
    if (!state.caseData) {
      setLoadError("Case data is missing. Refresh the page.");
      return;
    }
    if (state.startedAt == null) {
      setLoadError("Session not ready. Refresh the page.");
      return;
    }
    const form = getVisibleRulingForm(document);
    if (!form) {
      setLoadError("Could not find the ruling form. Try refreshing.");
      return;
    }
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const verdict = String(fd.get("verdict") ?? "");
    const sentenceText = String(fd.get("sentenceText") ?? "");
    const sn = fd.get("sentenceNumeric");
    const sentenceNumeric = sn === "" || sn === null ? null : Number(sn);
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
          ...(classSessionId ? { sessionId: classSessionId } : {}),
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
  }, [router, state, classSessionId]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="docket" />}>
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Card className="w-full max-w-md border-primary/25">
            <CardHeader>
              <CardTitle className="font-heading">Sign in to play</CardTitle>
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
        </div>
      </JudicialShell>
    );
  }

  if (loadError && !state.caseData) {
    return (
      <JudicialShell sidebar={<AppSidebarTrial phase="briefing" onPhaseNavigate={() => {}} />}>
        <div className="p-8 text-center">
          <p className="text-destructive" role="alert">
            {loadError}
          </p>
          <Link href="/" className={cn(buttonVariants({ variant: "link" }), "mt-4 inline-block")}>
            Return to docket
          </Link>
        </div>
      </JudicialShell>
    );
  }

  if (!state.caseData) {
    return (
      <JudicialShell
        sidebar={<AppSidebarTrial phase="briefing" onPhaseNavigate={() => {}} />}
      >
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Loading case file…
        </div>
      </JudicialShell>
    );
  }

  const c = state.caseData;
  const phaseIndex = GAME_PHASES.indexOf(state.phase);

  const navigateTrial = (p: GamePhase) => {
    const ti = GAME_PHASES.indexOf(p);
    if (ti <= phaseIndex) setPhase(p);
  };

  const center = (
    <div
      className={cn(
        "min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-8 lg:px-10",
        state.phase !== "ruling" && "xl:pr-2",
      )}
    >
      {loadError ? (
        <p
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}
      <div className="space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-primary">
          <span>Docket</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{c.category}</span>
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{c.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/40">
            Tier {c.tier}
          </Badge>
          <Badge variant="secondary">{c.kind === "CRIMINAL" ? "Criminal" : "Civil"}</Badge>
        </div>
        <nav className="flex flex-wrap gap-2 lg:hidden" aria-label="Case phases">
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
      </div>

      {state.phase !== "ruling" && (
      <div
        className={cn(
          "rounded-xl border border-primary/25 bg-gradient-to-b from-card to-[color-mix(in_oklab,var(--judicial-panel)_25%,var(--card))] p-4 shadow-sm md:p-6",
        )}
      >
        {state.phase === "briefing" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl text-foreground">Case overview</h2>
            <p className="text-sm leading-relaxed text-foreground/90">{c.briefSummary}</p>
            <p className="text-sm text-muted-foreground">
              Par time: <span className="font-medium text-foreground">{c.parTimeMinutes} min</span> (speed is a small
              style factor).
            </p>
            <Button type="button" onClick={() => nextPhase()}>
              Enter evidence locker
            </Button>
          </div>
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
            <LawLibrary
              caseId={c.id}
              precedents={c.precedents}
              kind={c.kind}
              classSessionId={classSessionId}
            />
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
      </div>
      )}

      {state.phase === "ruling" && (
        <div className="flex w-full flex-col items-center pb-8">
          <p className="mb-4 max-w-xl text-center text-sm text-muted-foreground">
            Record your verdict, disposition, and reasoning here. Nothing is submitted until you finalize.
          </p>
          <div className="w-full max-w-2xl lg:max-w-3xl">
            <LegalPadPanel
              layout="center"
              kind={c.kind}
              appellateSeat={c.appellateSeat}
              phase={state.phase}
              submitting={submitting}
              onSubmit={submitRuling}
              onBack={() => setPhase("library")}
            />
          </div>
        </div>
      )}
    </div>
  );

  const rightRail =
    state.phase === "ruling" ? undefined : (
      <div className="hidden max-h-[calc(100vh-5rem)] min-h-0 w-full overflow-y-auto xl:block">
        <LegalPadPanel
          kind={c.kind}
          appellateSeat={c.appellateSeat}
          phase={state.phase}
          submitting={submitting}
          onSubmit={submitRuling}
          onBack={() => setPhase("library")}
        />
      </div>
    );

  return (
    <JudicialShell
      sidebar={<AppSidebarTrial phase={state.phase} onPhaseNavigate={navigateTrial} />}
      rightRail={rightRail}
    >
      {center}
    </JudicialShell>
  );
}
