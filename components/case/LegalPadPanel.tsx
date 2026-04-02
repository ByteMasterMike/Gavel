"use client";

import { RulingTemplate } from "./RulingTemplate";
import type { GamePhase, PublicCasePayload } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** When mobile + desktop legal pads both mount, only one is visible; submit must use that form. */
export function getVisibleRulingForm(doc: Document): HTMLFormElement | null {
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

type Props = {
  kind: PublicCasePayload["kind"];
  appellateSeat: boolean;
  phase: GamePhase;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
  /** `center` = main column (ruling); `rail` = narrow right sidebar. */
  layout?: "rail" | "center";
};

export function LegalPadPanel({
  kind,
  appellateSeat,
  phase,
  submitting,
  onSubmit,
  onBack,
  layout = "rail",
}: Props) {
  const handleFinalizeClick = () => {
    void onSubmit();
  };

  const handleBackClick = () => {
    onBack();
  };

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
        <Button type="button" className="w-full" disabled={submitting} onClick={handleFinalizeClick}>
          {submitting ? "Submitting…" : "Finalize decision"}
        </Button>
        <Button type="button" variant="ghost" className="w-full text-muted-foreground" disabled>
          Save draft
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleBackClick}>
          Back to library
        </Button>
      </div>
    </div>
  );
}
