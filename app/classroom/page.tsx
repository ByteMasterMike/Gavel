"use client";

import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, BookOpen, Gavel, Users } from "lucide-react";

const METRICS = [
  { label: "Argument velocity", value: "14.2 items / min" },
  { label: "Jury consensus", value: "68%" },
  { label: "Critical flags", value: "03 pending" },
];

const STREAM = [
  {
    tone: "destructive" as const,
    title: "Logical fallacy detected",
    body: "Student cited irrelevance between training data drift and proximate cause.",
    meta: "Miller, A. · 14:22:01",
    action: "Interject",
  },
  {
    tone: "default" as const,
    title: "Strong precedent cited",
    body: "State v. Loomis (2016) invoked for algorithmic transparency.",
    meta: "Zhang, L. · 14:20:45",
    action: "Highlight",
  },
  {
    tone: "muted" as const,
    title: "Counter-argument formed",
    body: "Trade secret doctrine raised against discovery motion.",
    meta: "Thompson, E. · 14:18:12",
    action: "Acknowledge",
  },
];

export default function ClassroomPage() {
  const main = (
    <div className="px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <Badge variant="outline" className="border-amber-500/50 text-amber-200">
          Demo · no live session
        </Badge>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Live session</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">The People vs. Algorithmic Bias</h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="size-4 text-primary" />
              +42 observers
            </span>
            <span className="rounded-full border border-red-500/40 px-2 py-0.5 text-xs text-red-200">
              Live proceedings
            </span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {METRICS.map((m) => (
            <Card key={m.label} className="border-primary/20 bg-card/80">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide text-primary">{m.label}</CardDescription>
                <CardTitle className="font-heading text-xl">{m.value}</CardTitle>
              </CardHeader>
              {m.label.includes("Consensus") && (
                <CardContent>
                  <Progress value={68} className="h-1.5" />
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-card/70 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <Activity className="size-5 text-primary" />
                Precedent logic heatmap
              </CardTitle>
              <CardDescription>Tracing citation density across student submissions (mock).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-muted/10 text-sm text-muted-foreground">
                Visualization placeholder
              </div>
              <div className="mt-3 flex justify-between text-[10px] uppercase text-muted-foreground">
                <span>Low citation density</span>
                <span>High citation density</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-b from-card to-accent/15">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Verdict projections</CardTitle>
              <CardDescription>Mock poll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex aspect-square max-h-40 items-center justify-center rounded-lg border-2 border-primary/50 bg-background/50">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">42</p>
                  <p className="text-xs uppercase text-muted-foreground">Total votes</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Guilty / liability</span>
                  <span className="font-medium text-primary">74%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Not guilty</span>
                  <span>18%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Undecided</span>
                  <span>8%</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-card/80">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-heading text-lg">Live evidence stream</CardTitle>
            <Badge variant="secondary">12 new flags</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {STREAM.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-muted/10 p-4"
              >
                <div className="flex items-start gap-3">
                  {item.tone === "destructive" && <AlertTriangle className="size-5 shrink-0 text-red-400" />}
                  {item.tone === "default" && <BookOpen className="size-5 shrink-0 text-primary" />}
                  {item.tone === "muted" && <Gavel className="size-5 shrink-0 text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="shrink-0 border-primary/40">
                    {item.action}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-teal-500/20 bg-[color-mix(in_oklab,var(--judicial-panel)_40%,var(--card))]">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Brief of the court</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            <p>
              Mock copy: procedural due process requires that parties understand how algorithmic risk tools affect
              outcomes. This session explores weighting mechanisms under the Fourteenth Amendment framework.
            </p>
            <p className="mt-3 text-xs text-primary">Ref: ALPHA-9-2024 · Expand dossier (coming soon)</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Analytical rigor</p>
            <Progress value={82} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-primary">Excellent</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Oral argument participation</p>
            <Progress value={34} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">Low</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary">
            Call recess
          </Button>
          <Button type="button" className="bg-red-950/80 text-red-100 hover:bg-red-900">
            Adjourn session
          </Button>
        </div>
      </div>
    </div>
  );

  return <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>{main}</JudicialShell>;
}
