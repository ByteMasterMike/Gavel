"use client";

import { FolderOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CaseFileViewer } from "./CaseFileViewer";
import { useCaseSession } from "./CaseSessionContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function EvidenceLocker() {
  const { state, toggleFlag, toggleStar, markOpened } = useCaseSession();
  const docs = useMemo(() => state.caseData?.documents ?? [], [state.caseData]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = useMemo(() => {
    if (!docs.length) return null;
    if (selectedId && docs.some((d) => d.id === selectedId)) return selectedId;
    return docs[0]!.id;
  }, [docs, selectedId]);

  const active = useMemo(
    () => docs.find((d) => d.id === activeId) ?? docs[0],
    [docs, activeId],
  );

  useEffect(() => {
    if (active) markOpened(active.id);
  }, [active, markOpened]);

  if (!docs.length) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_1fr]">
      <div className="rounded-xl border border-border bg-card/80 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Evidence locker
        </p>
        <ul className="space-y-1">
          {docs.map((d) => {
            const open = state.openedDocIds.has(d.id);
            return (
              <li key={d.id}>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-auto w-full justify-start gap-2 py-2 text-left font-normal",
                    d.id === active?.id && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => setSelectedId(d.id)}
                >
                  <FolderOpen className={cn("size-4 shrink-0", open && "text-primary")} />
                  <span className="line-clamp-2 text-sm">{d.title}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
      {active && (
        <CaseFileViewer
          doc={active}
          flagged={state.flaggedIds.has(active.id)}
          starred={state.starredIds.has(active.id)}
          onToggleFlag={() => toggleFlag(active.id)}
          onToggleStar={() => toggleStar(active.id)}
        />
      )}
    </div>
  );
}
