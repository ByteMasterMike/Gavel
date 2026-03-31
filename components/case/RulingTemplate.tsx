"use client";

import { useCaseSession } from "./CaseSessionContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CaseKind } from "@/types";

type Props = {
  kind: CaseKind;
  className?: string;
};

export function RulingTemplate({ kind, className }: Props) {
  const { setVerdict } = useCaseSession();

  const verdictOptions =
    kind === "CRIMINAL"
      ? [
          { value: "GUILTY", label: "Guilty" },
          { value: "NOT_GUILTY", label: "Not guilty" },
        ]
      : [
          { value: "LIABLE", label: "Liable" },
          { value: "NOT_LIABLE", label: "Not liable" },
        ];

  return (
    <form data-ruling-form="" className={cn("mx-auto max-w-2xl space-y-6", className)}>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {kind === "CRIMINAL" ? "Verdict" : "Liability finding"}
        </p>
        <div className="flex flex-wrap gap-3">
          {verdictOptions.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              )}
            >
              <input
                type="radio"
                name="verdict"
                value={o.value}
                required
                className="accent-primary"
                onChange={() => setVerdict(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sentenceText">
          {kind === "CRIMINAL" ? "Sentence / disposition" : "Damages or remedy"}
        </Label>
        <Textarea
          id="sentenceText"
          name="sentenceText"
          required
          rows={3}
          placeholder={
            kind === "CRIMINAL"
              ? "e.g., 12 months probation, $500 fine, restitution…"
              : "e.g., Compensatory damages, injunctive relief…"
          }
          className="resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sentenceNumeric">Numeric anchor (optional)</Label>
        <Input
          id="sentenceNumeric"
          name="sentenceNumeric"
          type="number"
          step="any"
          placeholder="e.g., total fine or damages in dollars"
        />
        <p className="text-xs text-muted-foreground">
          Used for range scoring when applicable (fines, restitution, damages).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="findingsOfFact">Findings of fact</Label>
        <Textarea
          id="findingsOfFact"
          name="findingsOfFact"
          required
          rows={5}
          placeholder="What do you find happened, based on the record?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="applicationOfLaw">
          {kind === "CRIMINAL" ? "Application of law" : "Legal analysis"}
        </Label>
        <Textarea
          id="applicationOfLaw"
          name="applicationOfLaw"
          required
          rows={5}
          placeholder="How do your cited authorities apply?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mitigatingFactors">
          {kind === "CRIMINAL"
            ? "Mitigating or aggravating factors"
            : "Basis for remedy"}
        </Label>
        <Textarea
          id="mitigatingFactors"
          name="mitigatingFactors"
          required
          rows={4}
          placeholder={
            kind === "CRIMINAL"
              ? "Sentencing considerations…"
              : "Why this remedy fits the liability finding…"
          }
        />
      </div>
    </form>
  );
}
