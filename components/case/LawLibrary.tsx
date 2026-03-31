"use client";

import { BookMarked, Lightbulb } from "lucide-react";
import { useMemo, useState } from "react";
import { useCaseSession } from "./CaseSessionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CaseKind } from "@/types";

/** MVP: after hints, we only show relevant items (server never exposes isRelevant — client simulates hint by requesting nothing extra; we store relevance only on server for scoring). */
type Prec = {
  id: string;
  name: string;
  citation: string;
  summary: string;
  sortOrder: number;
};

type Props = {
  caseId: string;
  precedents: Prec[];
  kind: CaseKind;
  /** Unlocks hints when the case is played inside a joined class session. */
  classSessionId?: string | null;
};

export function LawLibrary({ caseId, precedents, kind, classSessionId }: Props) {
  const { state, togglePrecedent, bumpHintsUsed } = useCaseSession();
  const [q, setQ] = useState("");
  const [hintVisibleIds, setHintVisibleIds] = useState<string[] | null>(null);
  const max = state.caseData?.maxPrecedents ?? 5;

  const pool = useMemo(() => {
    if (!hintVisibleIds) return precedents;
    const set = new Set(hintVisibleIds);
    return precedents.filter((p) => set.has(p.id));
  }, [precedents, hintVisibleIds]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return pool.filter((p) => {
      const hay = `${p.name} ${p.citation} ${p.summary}`.toLowerCase();
      return !t || hay.includes(t);
    });
  }, [pool, q]);

  async function onHint() {
    if (state.hintsUsed >= 2) return;
    const nextLevel = state.hintsUsed + 1;
    const res = await fetch(`/api/cases/${caseId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: nextLevel,
        ...(classSessionId ? { sessionId: classSessionId } : {}),
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { visibleIds: string[] };
    setHintVisibleIds(data.visibleIds);
    bumpHintsUsed();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-semibold">Law library</h3>
          <p className="text-sm text-muted-foreground">
            Select up to {max} authorities you rely on. Using hints reduces precedent style points.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => void onHint()}
            disabled={state.hintsUsed >= 2}
          >
            <Lightbulb className="size-4" />
            Hint ({state.hintsUsed}/2)
          </Button>
          <Badge variant="secondary" className="h-8 px-3 py-0 text-xs">
            Cited: {state.citedPrecedentIds.length}/{max}
          </Badge>
        </div>
      </div>
      <Input
        placeholder="Search statutes and cases…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search law library"
      />
      <ScrollArea className="h-[min(420px,50vh)] pr-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => {
            const selected = state.citedPrecedentIds.includes(p.id);
            return (
              <Card
                key={p.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selected && "ring-2 ring-primary",
                )}
                onClick={() => togglePrecedent(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePrecedent(p.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start gap-2 text-base font-semibold leading-snug">
                    <BookMarked className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{p.name}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{p.citation}</p>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-4 text-sm text-muted-foreground">{p.summary}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">
        {kind === "CRIMINAL"
          ? "Criminal: focus on elements, intent, and evidentiary rules."
          : "Civil: focus on misrepresentation, reliance, and damages."}
      </p>
    </div>
  );
}
