"use client";

import { useEffect, useState } from "react";
import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchOkJson } from "@/lib/fetchWithRetry";
import { Trophy } from "lucide-react";

type LeaderPayload = {
  entries: { rank: number; displayName: string; totalScore: number; image: string | null }[];
  me: { rank: number; totalScore: number } | null;
  caseTitle: string | null;
};

const FEATURED = [
  {
    rank: "01",
    name: "Hon. Alistair Thorne",
    role: "Chief Justice of the High Hall",
    stats: { rulings: "1,429", influence: "98.2%", prestige: "Gold" },
    quote: null as string | null,
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=500&fit=crop",
  },
  {
    rank: "02",
    name: "Elena Vance",
    role: "Senior Associate",
    stats: null,
    quote: "Truth is the only anchor in the storm of opinion.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=400&fit=crop",
  },
  {
    rank: "03",
    name: "Silas Vane",
    role: "Senior Associate",
    stats: null,
    quote: "The law is a living organism, evolving with logic.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=400&fit=crop",
  },
];

export default function HallPage() {
  const [board, setBoard] = useState<LeaderPayload | null>(null);

  useEffect(() => {
    let c = false;
    void (async () => {
      const res = await fetchOkJson<LeaderPayload>("/api/leaderboard/daily");
      if (!c && res.ok) setBoard(res.data);
    })();
    return () => {
      c = true;
    };
  }, []);

  const rising = board?.entries?.slice(0, 8) ?? [];

  const main = (
    <div className="px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Official register</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">The Supreme 9 Hall</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Apex of the docket — ceremonial portraits and rising jurists. Featured justices are illustrative; daily
            rankings pull from live Morning Docket play.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-primary/35 bg-card/90 lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge className="mb-2 bg-primary text-primary-foreground">{FEATURED[0].rank}</Badge>
                  <CardTitle className="font-heading text-2xl">{FEATURED[0].name}</CardTitle>
                  <CardDescription className="text-primary">{FEATURED[0].role}</CardDescription>
                </div>
                <Trophy className="size-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-primary/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FEATURED[0].image} alt="" className="size-full object-cover" />
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-border bg-muted/20 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Rulings</p>
                    <p className="font-semibold">{FEATURED[0].stats?.rulings}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Influence</p>
                    <p className="font-semibold">{FEATURED[0].stats?.influence}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Prestige</p>
                    <p className="font-semibold text-primary">{FEATURED[0].stats?.prestige}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Fictional exemplar for atmosphere — your competitive rank is reflected in the live board.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {FEATURED.slice(1).map((f) => (
              <Card key={f.rank} className="border-primary/20 bg-card/80">
                <CardContent className="flex gap-4 pt-6">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.image!} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <Badge variant="outline" className="mb-1 border-primary/40 text-primary">
                      {f.rank}
                    </Badge>
                    <p className="font-heading font-semibold">{f.name}</p>
                    <p className="text-xs uppercase text-muted-foreground">{f.role}</p>
                    {f.quote && <p className="mt-2 text-xs italic text-muted-foreground">&ldquo;{f.quote}&rdquo;</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-primary/25 bg-gradient-to-br from-accent/20 to-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Rising jurists (today)</CardTitle>
              <CardDescription>
                {board?.caseTitle ? `Morning Docket: ${board.caseTitle}` : "Best score per judge on today’s challenge."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rising.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries yet — claim the first seat.</p>
              ) : (
                <ol className="space-y-2">
                  {rising.map((e) => (
                    <li
                      key={`${e.rank}-${e.displayName}`}
                      className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">#{e.rank}</span>
                      <span className="flex-1 truncate px-2 font-medium">{e.displayName}</span>
                      <span className="tabular-nums text-primary">{e.totalScore.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              )}
              {board?.me && (
                <p className="mt-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  Your standing: <span className="font-semibold">#{board.me.rank}</span> ·{" "}
                  {board.me.totalScore.toLocaleString()} pts
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80">
            <CardHeader>
              <CardTitle className="font-heading text-lg">The ledger of authority</CardTitle>
              <CardDescription>Illustrative stats for the hall narrative.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-2xl font-semibold text-primary">12</p>
                <p className="text-xs text-muted-foreground">Jurisdictions</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-primary">1,402</p>
                <p className="text-xs text-muted-foreground">Active cases</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-primary">1.2M</p>
                <p className="text-xs text-muted-foreground">Precedents</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="border-primary/40">
            Review global bylaws
          </Button>
          <Button type="button" variant="outline" className="border-primary/40">
            Compare rankings
          </Button>
        </div>
      </div>
    </div>
  );

  return <JudicialShell sidebar={<AppSidebarHome active="chambers" />}>{main}</JudicialShell>;
}
