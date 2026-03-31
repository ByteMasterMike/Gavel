"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CareerSection } from "@/components/home/CareerSection";
import { fetchOkJson } from "@/lib/fetchWithRetry";

type CaseRow = {
  id: string;
  title: string;
  tier: number;
  kind: string;
  category: string;
  parTimeMinutes: number;
};

type DailyPayload = { daily?: { case: { id: string } } | null };

type CasesPayload = { cases: CaseRow[] };

export default function Home() {
  const { data: session, status } = useSession();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [dailyId, setDailyId] = useState<string | null>(null);
  const [casesStatus, setCasesStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadDocket = useCallback(async () => {
    setCasesStatus("loading");
    setCases([]);

    void (async () => {
      const dailyRes = await fetchOkJson<DailyPayload>("/api/daily?summary=1");
      if (dailyRes.ok) {
        setDailyId(dailyRes.data.daily?.case.id ?? null);
      }
    })();

    const casesRes = await fetchOkJson<CasesPayload>("/api/cases");
    if (!casesRes.ok) {
      setCasesStatus("error");
      return;
    }

    setCases(casesRes.data.cases);
    setCasesStatus("ready");
  }, []);

  useEffect(() => {
    void loadDocket();
  }, [loadDocket]);

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">The Gavel</p>
          <h1 className="mt-1 font-heading text-4xl font-bold tracking-tight">Morning docket</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Real materials. Hidden outcomes. Rule from the bench — then see how history judged it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "loading" ? (
            <span className="text-sm text-muted-foreground">Session…</span>
          ) : session?.user ? (
            <>
              <span className="text-sm text-muted-foreground">{session.user.email}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              {process.env.NODE_ENV === "development" && (
                <Button type="button" size="sm" onClick={() => signIn("dev", { callbackUrl: "/" })}>
                  Dev sign-in
                </Button>
              )}
              <Button type="button" size="sm" variant="secondary" onClick={() => signIn("google", { callbackUrl: "/" })}>
                Google
              </Button>
            </>
          )}
        </div>
      </header>

      {session?.user && <CareerSection key={session.user.id} />}

      {dailyId && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>The Morning Docket</CardTitle>
            <CardDescription>Today&apos;s shared challenge — same case worldwide.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/case/${dailyId}`} className={cn(buttonVariants())}>
              Play today&apos;s case
            </Link>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 font-heading text-xl font-semibold">Case library</h2>
        {casesStatus === "loading" && (
          <p className="text-sm text-muted-foreground">Loading docket…</p>
        )}
        {casesStatus === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load cases. Check your connection and try again.
            </p>
            <Button type="button" size="sm" variant="secondary" onClick={() => void loadDocket()}>
              Retry
            </Button>
          </div>
        )}
        {casesStatus === "ready" && (
          <>
            <ul className="flex flex-col gap-3">
              {cases.map((c) => (
                <li key={c.id}>
                  <Card>
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-base font-semibold">{c.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">Tier {c.tier}</Badge>
                        <Badge variant="secondary">{c.kind === "CRIMINAL" ? "Criminal" : "Civil"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-sm text-muted-foreground">
                        {c.category} · ~{c.parTimeMinutes} min par
                      </p>
                      {session?.user ? (
                        <Link
                          href={`/case/${c.id}`}
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          Open case
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
                No cases in database. Run{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">npx prisma migrate deploy</code> and{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run db:seed</code>.
              </p>
            )}
          </>
        )}
      </div>

      <Separator />

      <footer className="text-xs text-muted-foreground">
        Educational game — not legal advice. Core loop MVP: briefing, evidence, library, ruling, reveal.
      </footer>
    </div>
  );
}
