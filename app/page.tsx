"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CareerSection } from "@/components/home/CareerSection";
import { DailyLeaderboard } from "@/components/home/DailyLeaderboard";
import { fetchOkJson } from "@/lib/fetchWithRetry";
import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { ChevronRight } from "lucide-react";

type CaseRow = {
  id: string;
  title: string;
  tier: number;
  kind: string;
  category: string;
  parTimeMinutes: number;
};

type DailyPayload = {
  daily?: { case: { id: string; title: string; tier: number; category: string } } | null;
};

type DailySummary = NonNullable<DailyPayload["daily"]>;

type CasesPayload = { cases: CaseRow[] };

const DIFFICULTY: Record<number, string> = {
  1: "Novice",
  2: "Expert",
  3: "Master",
  4: "Master",
  5: "Master",
};

export default function Home() {
  const { data: session, status } = useSession();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [casesStatus, setCasesStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadDocket = useCallback(async () => {
    setCasesStatus("loading");
    setCases([]);

    try {
      void (async () => {
        const dailyRes = await fetchOkJson<DailyPayload>("/api/daily?summary=1");
        if (dailyRes.ok) {
          setDaily(dailyRes.data.daily ?? null);
        } else {
          setDaily(null);
        }
      })();

      const casesRes = await fetchOkJson<CasesPayload>("/api/cases");
      if (!casesRes.ok) {
        setCasesStatus("error");
        return;
      }

      setCases(casesRes.data.cases);
      setCasesStatus("ready");
    } catch {
      setCasesStatus("error");
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void loadDocket(), 0);
    return () => window.clearTimeout(t);
  }, [loadDocket]);

  const dailyId = daily?.case?.id ?? null;
  const dailyTitle = daily?.case?.title ?? "Today’s case";
  const greetingName =
    session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "Justice";

  const main = (
    <div className="px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Good morning, {greetingName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            The court awaits your deliberation. Pick up the Morning Docket or open a case from the library.
          </p>
        </div>

        {session?.user && (
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <CareerSection key={session.user.id} />
            <div className="flex flex-col gap-6">
              {dailyId ? (
                <Card className="flex flex-1 flex-col border-primary/40 bg-gradient-to-br from-card via-card to-accent/25">
                  <CardHeader>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      Morning docket challenge
                    </p>
                    <CardTitle className="font-heading text-2xl text-foreground md:text-3xl">
                      {dailyTitle}
                    </CardTitle>
                    <CardDescription>
                      {daily?.case?.category ?? "Shared challenge"} · Tier {daily?.case?.tier ?? "—"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      Same case for every judge today. Highest score climbs the daily board.
                    </p>
                    <Link
                      href={`/case/${dailyId}`}
                      className={cn(
                        buttonVariants(),
                        "inline-flex w-full items-center justify-center gap-2 sm:w-auto",
                      )}
                    >
                      Play today&apos;s case
                      <ChevronRight className="size-4" />
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-border">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Morning docket</CardTitle>
                    <CardDescription>No daily challenge is configured yet.</CardDescription>
                  </CardHeader>
                </Card>
              )}
              <DailyLeaderboard />
            </div>
          </div>
        )}

        {!session?.user && status !== "loading" && (
          <Card className="border-primary/30 bg-card/80">
            <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Sign in to track career, streak, and daily leaderboard.</p>
              <div className="flex flex-wrap gap-2">
                {process.env.NODE_ENV === "development" && (
                  <Button type="button" onClick={() => signIn("dev", { callbackUrl: "/" })}>
                    Dev sign-in
                  </Button>
                )}
                <Button type="button" variant="secondary" onClick={() => signIn("google", { callbackUrl: "/" })}>
                  Continue with Google
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <section id="case-library" className="scroll-mt-24">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Archives</p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">Case library</h2>
            </div>
          </div>
          {casesStatus === "loading" && <p className="text-sm text-muted-foreground">Loading docket…</p>}
          {casesStatus === "error" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Couldn&apos;t load cases. Check your connection.</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => void loadDocket()}>
                Retry
              </Button>
            </div>
          )}
          {casesStatus === "ready" && (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cases.map((c) => (
                  <li key={c.id}>
                    <Card
                      className={cn(
                        "h-full overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-accent/15",
                        "transition-shadow hover:shadow-md hover:shadow-primary/5",
                      )}
                    >
                      <CardHeader className="space-y-2 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="font-heading text-lg leading-snug">{c.title}</CardTitle>
                          <Badge variant="outline" className="shrink-0 border-primary/40 text-primary">
                            {DIFFICULTY[c.tier] ?? `Tier ${c.tier}`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.category} · ~{c.parTimeMinutes} min
                        </p>
                      </CardHeader>
                      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                        <Badge variant="secondary">{c.kind === "CRIMINAL" ? "Criminal" : "Civil"}</Badge>
                        {session?.user ? (
                          <Link href={`/case/${c.id}`} className={cn(buttonVariants({ size: "sm" }), "gap-1")}>
                            Open case
                            <ChevronRight className="size-3.5" />
                          </Link>
                        ) : (
                          <Button type="button" size="sm" disabled>
                            Sign in to play
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
              {!cases.length && (
                <p className="text-sm text-muted-foreground">
                  No cases in database. Run <code className="rounded bg-muted px-1 py-0.5 text-xs">npx prisma migrate deploy</code> and{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run db:seed</code>.
                </p>
              )}
            </>
          )}
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          Educational game — not legal advice. Briefing, evidence, library, ruling, reveal.
        </footer>
      </div>
    </div>
  );

  return (
    <JudicialShell sidebar={<AppSidebarHome active="docket" />}>{main}</JudicialShell>
  );
}
