"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchOkJson } from "@/lib/fetchWithRetry";
import { Trophy, Gavel, Scale } from "lucide-react";

type DailyPayload = {
  entries: { rank: number; displayName: string; totalScore: number; image: string | null }[];
  me: { rank: number; totalScore: number } | null;
  caseTitle: string | null;
  timeZone?: string;
};

type CareerPayload = {
  tier: number;
  entries: {
    rank: number;
    displayName: string;
    careerPoints: number;
    image: string | null;
  }[];
};

type CategoryPayload = {
  category: string;
  minPlays: number;
  entries: {
    rank: number;
    userId: string;
    displayName: string;
    totalScore: number;
    plays: number;
    image: string | null;
  }[];
};

type SupremePayload = {
  seats: {
    slot: number;
    careerPointsSnapshot: number;
    user: {
      id: string;
      displayName: string;
      image: string | null;
      careerPoints: number;
      currentTier: number;
    } | null;
  }[];
};

type MePayload = {
  user: {
    morningGavelCount?: number;
  } | null;
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
  const { data: session } = useSession();
  const [board, setBoard] = useState<DailyPayload | null>(null);
  const [supreme, setSupreme] = useState<SupremePayload | null>(null);
  const [careerTier, setCareerTier] = useState(3);
  const [career, setCareer] = useState<CareerPayload | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryKey, setCategoryKey] = useState<string>("");
  const [categoryBoard, setCategoryBoard] = useState<CategoryPayload | null>(null);
  const [morningCount, setMorningCount] = useState<number | null>(null);

  useEffect(() => {
    let c = false;
    void (async () => {
      const [d, s, cat, me] = await Promise.all([
        fetchOkJson<DailyPayload>("/api/leaderboard/daily"),
        fetchOkJson<SupremePayload>("/api/leaderboard/supreme-nine"),
        fetchOkJson<{ categories: string[] }>("/api/leaderboard/categories"),
        session?.user ? fetchOkJson<MePayload>("/api/me") : Promise.resolve({ ok: false as const, data: null }),
      ]);
      if (c) return;
      if (d.ok) setBoard(d.data);
      if (s.ok) setSupreme(s.data);
      if (cat.ok && cat.data.categories.length > 0) {
        setCategories(cat.data.categories);
        setCategoryKey(cat.data.categories[0]!);
      }
      if (me.ok && me.data?.user?.morningGavelCount != null) {
        setMorningCount(me.data.user.morningGavelCount);
      }
    })();
    return () => {
      c = true;
    };
  }, [session?.user]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetchOkJson<CareerPayload>(`/api/leaderboard/career?tier=${careerTier}`);
      if (!cancelled && res.ok) setCareer(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [careerTier]);

  useEffect(() => {
    if (!categoryKey) {
      queueMicrotask(() => setCategoryBoard(null));
      return;
    }
    let cancelled = false;
    void (async () => {
      const q = encodeURIComponent(categoryKey);
      const res = await fetchOkJson<CategoryPayload>(`/api/leaderboard/category?category=${q}`);
      if (!cancelled && res.ok) setCategoryBoard(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryKey]);

  const handleCareerTierSelect = useCallback((tier: number) => {
    setCareerTier(tier);
  }, []);

  const handleCategorySelect = useCallback((key: string) => {
    setCategoryKey(key);
  }, []);

  const rising = board?.entries?.slice(0, 8) ?? [];
  const seats = supreme?.seats ?? [];

  const main = (
    <main className="px-4 py-8 md:px-8 lg:px-10" aria-labelledby="hall-page-title">
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Official register</p>
          <h1 id="hall-page-title" className="mt-2 font-heading text-3xl font-semibold md:text-4xl">
            The Supreme 9 Hall
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Ceremonial portraits below are illustrative. Live boards pull from your Morning Docket (local day),
            career tier standings, practice area totals, and the Tier 5 Supreme 9 snapshot.
          </p>
        </div>

        {session?.user && morningCount != null && morningCount > 0 && (
          <Card className="border-primary/35 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-heading text-lg text-primary">
                <Gavel className="size-5" />
                Morning Gavel
              </CardTitle>
              <CardDescription>
                You have placed in the top 10 on your local daily board{" "}
                <span className="font-medium text-foreground">{morningCount}</span> time
                {morningCount === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="border-primary/30 bg-card/90">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Scale className="size-6 text-primary" />
                Supreme 9 (Tier 5)
              </CardTitle>
              <Badge variant="outline" className="border-primary/40">
                Live snapshot
              </Badge>
            </div>
            <CardDescription>Top nine career points among judges currently seated at Tier 5.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-3">
              {seats.length === 0 ? (
                <p className="col-span-3 text-sm text-muted-foreground">Loading seats…</p>
              ) : (
                seats.map((s) => (
                  <div
                    key={s.slot}
                    className="flex flex-col items-center rounded-lg border border-border/70 bg-muted/10 px-2 py-4 text-center"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Seat {s.slot}
                    </span>
                    {s.user ? (
                      <>
                        {s.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.user.image}
                            alt=""
                            className="mt-2 size-14 rounded-full border border-primary/30 object-cover"
                          />
                        ) : (
                          <div className="mt-2 flex size-14 items-center justify-center rounded-full border border-primary/30 bg-muted text-sm font-semibold">
                            {s.user.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <p className="mt-2 max-w-full truncate text-xs font-medium">{s.user.displayName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.user.careerPoints.toLocaleString()} CP
                        </p>
                      </>
                    ) : (
                      <p className="mt-4 text-xs text-muted-foreground">Vacant</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

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
                  Fictional exemplar for atmosphere — your competitive rank is reflected in the live boards above and
                  below.
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
              <CardTitle className="font-heading text-lg">Rising jurists (your local day)</CardTitle>
              <CardDescription>
                {board?.caseTitle ? `Morning Docket: ${board.caseTitle}` : "Best score per judge on today’s challenge."}
                {board?.timeZone ? ` · ${board.timeZone}` : null}
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
              <CardTitle className="font-heading text-lg">Career board by tier</CardTitle>
              <CardDescription>Top career points among judges currently at the selected tier.</CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={careerTier === t ? "default" : "outline"}
                    className="h-8 min-w-9"
                    onClick={() => handleCareerTierSelect(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {!career?.entries?.length ? (
                <p className="text-sm text-muted-foreground">No entries at this tier yet.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {career.entries.slice(0, 10).map((e) => (
                    <li
                      key={e.rank + e.displayName}
                      className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                    >
                      <span className="text-muted-foreground">#{e.rank}</span>
                      <span className="flex-1 truncate px-2 font-medium">{e.displayName}</span>
                      <span className="tabular-nums text-primary">{e.careerPoints.toLocaleString()} CP</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-card/80">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Category totals</CardTitle>
            <CardDescription>
              Sum of scored case XP in each practice area (minimum {categoryBoard?.minPlays ?? 3} plays to qualify).
            </CardDescription>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={categoryKey === c ? "default" : "outline"}
                    onClick={() => handleCategorySelect(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!categoryBoard?.entries?.length ? (
              <p className="text-sm text-muted-foreground">No qualifying judges in this category yet.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {categoryBoard.entries.slice(0, 12).map((e) => (
                  <li
                    key={e.userId}
                    className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                  >
                    <span className="text-muted-foreground">#{e.rank}</span>
                    <span className="flex-1 truncate px-2 font-medium">{e.displayName}</span>
                    <span className="shrink-0 tabular-nums text-primary">{e.totalScore.toLocaleString()} pts</span>
                    <span className="shrink-0 pl-2 text-xs text-muted-foreground">{e.plays} plays</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-primary/40 px-4 text-sm font-medium hover:bg-muted/50"
          >
            Return to docket
          </Link>
        </div>
      </div>
    </main>
  );

  return <JudicialShell sidebar={<AppSidebarHome active="chambers" />}>{main}</JudicialShell>;
}
