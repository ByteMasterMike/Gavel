"use client";

import { Flag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PublicCaseDocument } from "@/types";

type Props = {
  doc: PublicCaseDocument;
  flagged: boolean;
  starred: boolean;
  onToggleFlag: () => void;
  onToggleStar: () => void;
};

export function CaseFileViewer({ doc, flagged, starred, onToggleFlag, onToggleStar }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-semibold tracking-tight">{doc.title}</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={flagged ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={onToggleFlag}
            aria-pressed={flagged}
          >
            <Flag className="size-4" />
            Objection
          </Button>
          <Button
            type="button"
            variant={starred ? "secondary" : "outline"}
            size="sm"
            className="gap-1"
            onClick={onToggleStar}
            aria-pressed={starred}
          >
            <Star className={cn("size-4", starred && "fill-amber-400 text-amber-400")} />
            Star
          </Button>
        </div>
      </div>
      <ScrollArea className="max-h-[50vh] min-h-[200px] rounded-md border border-border/60 bg-background/50 p-4 text-sm leading-relaxed">
        <p className="whitespace-pre-wrap">{doc.content}</p>
      </ScrollArea>
    </div>
  );
}
