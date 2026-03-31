"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CareerSection } from "@/components/home/CareerSection";
import { DailyLeaderboard } from "@/components/home/DailyLeaderboard";
import { fetchOkJson } from "@/lib/fetchWithRetry";
import { JudicialShell, SOVEREIGN_HEADER_PT } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { MobileHomeNav } from "@/components/shell/MobileHomeNav";
import { Bookmark, Play, Search } from "lucide-react";

const MORNING_DOCKET_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBpWEgRHZK4BhNKKMQTwL2bQKpxCS6wmXY7bcU6K4LE1TIsyeXmIk0PinY1Mj_1JFFQDDQC8Lz8j_CZjGmgms7ZDMvahc_L6Xlg_HSvFm8kmUt8f-uCRwyWMPqAe5Fi7c3k6uG8zWYrUKAG4By2CMlEffW0R6_tGO6ZnZyXcNlyt4hL2DiyfDWyJg1Btxf9DdO9EVokOqJb5-iild0CxPcDKoVQNKiu0TaR4chELsdYrqXwlHs---IMmU2DJiaBfN60cUY51gmxgsZ-";

type CaseRow = {
  id: string;
  title: string;
  tier: number;
  kind: string;
  category: string;
  parTimeMinutes: number;
  briefSummary: string;
};

type DailyPayload = {
  daily?: {
    case: {
      id: string;
      title: string;
      tier: number;
      category: string;
      briefSummary: string;
    };
  } | null;
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

function syntheticCaseRef(id: string, tier: number): string {
  const alnum = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const core = (alnum.slice(0, 4) || "CASE").padEnd(4, "X");
  const tierChar = tier <= 1 ? "A" : tier === 2 ? "E" : tier === 3 ? "M" : "K";
  return `#${core}-${tierChar}`;
}

function truncateBrief(text: string, max = 240): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [casesStatus, setCasesStatus] = useState<"loading" | "ready" | "error">("loading");
  const [libraryQuery, setLibraryQuery] = useState("");

  const loadDocket = useCallback(async () => {
    setCasesStatus("loading");
    setCases([]);

    try {
      const [dailyRes, casesRes] = await Promise.all([
        fetchOkJson<DailyPayload>("/api/daily?summary=1"),
        fetchOkJson<CasesPayload>("/api/cases"),
      ]);

      if (dailyRes.ok) {
        setDaily(dailyRes.data.daily ?? null);
      } else {
        setDaily(null);
      }

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

  const filteredCases = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        syntheticCaseRef(c.id, c.tier).toLowerCase().includes(q) ||
        c.briefSummary.toLowerCase().includes(q),
    );
  }, [cases, libraryQuery]);

  const dailyId = daily?.case?.id ?? null;
  const dailyTitle = daily?.case?.title ?? "Today’s case";
  const dailyTier = daily?.case?.tier ?? 1;
  const dailyBrief = daily?.case?.briefSummary
    ? truncateBrief(daily.case.briefSummary)
    : null;

  const greetingName =
    session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "Justice";

  const pendingCount = session?.user ? cases.length : 0;
  const heroSubline =
    session?.user && casesStatus === "ready"
      ? pendingCount > 0
        ? `The Supreme Court awaits your deliberation. ${pendingCount} case${pendingCount === 1 ? "" : "s"} ${pendingCount === 1 ? "is" : "are"} pending for review today.`
        : "The Supreme Court awaits your deliberation. Your docket is clear — pick up the Morning Docket or browse the archives."
      : "The court awaits your deliberation. Pick up the Morning Docket or open a case from the library.";

  const main = (
    <div className={cn(SOVEREIGN_HEADER_PT, "mx-auto max-w-7xl px-6 pb-28 md:pb-12 lg:px-12")}>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="mb-2 lg:col-span-12">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#e5e2e1] md:text-5xl">
            Good morning, {greetingName}.
          </h1>
          <p className="font-body mt-2 max-w-2xl text-base text-[#d1c5b4] md:text-lg">{heroSubline}</p>
        </div>

        {session?.user && (
          <div id="progress" className="scroll-mt-28 space-y-8 lg:col-span-12 lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0">
            <div className="lg:col-span-4">
              <CareerSection key={session.user.id} />
            </div>
            <div className="flex flex-col gap-8 lg:col-span-8">
              {dailyId ? (
                <div className="group relative overflow-hidden rounded-lg shadow-2xl mahogany-texture">
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10 flex flex-col items-center gap-8 p-6 md:flex-row md:items-stretch md:gap-10 md:p-10">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-white/5 shadow-2xl md:w-1/3">
                      <Image
                        src={MORNING_DOCKET_IMAGE}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(min-width: 768px) 33vw, 100vw"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      {dailyTier >= 3 && (
                        <span className="absolute bottom-4 left-4 rounded bg-[#ffb3ac] px-2 py-1 font-label text-[10px] font-medium text-[#611111]">
                          High Stakes
                        </span>
                      )}
                    </div>
                    <div className="relative z-10 flex flex-1 flex-col text-center md:text-left">
                      <span className="font-label mb-3 block text-[10px] uppercase tracking-[0.3em] text-[#e9c176]">
                        Morning Docket Challenge
                      </span>
                      <h3 className="font-heading mb-4 text-3xl font-bold italic leading-tight text-white md:text-4xl">
                        {dailyTitle}
                      </h3>
                      <p className="font-body mb-8 max-w-md text-[#d1c5b4]/80 leading-relaxed">
                        {dailyBrief ??
                          "A landmark case on the docket today. Weigh the evidence and deliver your verdict before the session adjourns."}
                      </p>
                      <Link
                        href={`/case/${dailyId}`}
                        className={cn(
                          "mx-auto inline-flex items-center gap-3 rounded px-8 py-4 font-label text-sm font-bold uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-[0.98] md:mx-0",
                          "bg-[#e9c176] text-[#412d00] hover:bg-[#c5a059]",
                        )}
                      >
                        Play Today&apos;s Case
                        <Play className="size-4 fill-current" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="border-dashed border-[#4e4639] bg-[#201f1f]/80">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg text-[#e5e2e1]">Morning docket</CardTitle>
                    <CardDescription className="text-[#d1c5b4]">No daily challenge is configured yet.</CardDescription>
                  </CardHeader>
                </Card>
              )}
              <DailyLeaderboard />
            </div>
          </div>
        )}

        {!session?.user && status !== "loading" && (
          <div className="lg:col-span-12">
            <Card className="border border-[#e9c176]/30 bg-[#201f1f]/80">
              <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-body text-sm text-[#d1c5b4]">Sign in to track career, streak, and daily leaderboard.</p>
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
          </div>
        )}

        <section id="case-library" className="mt-4 scroll-mt-28 lg:col-span-12">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9c176]">Archives</span>
              <h2 className="font-heading mt-1 text-3xl text-[#e5e2e1]">Case Library</h2>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#d1c5b4]/40" />
              <Input
                type="search"
                placeholder="Search archives..."
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                className="h-11 rounded border-none bg-[#2a2a2a] py-3 pl-10 pr-4 font-label text-sm text-[#e5e2e1] placeholder:text-[#d1c5b4]/50 focus-visible:ring-1 focus-visible:ring-[#e9c176]"
                aria-label="Search case library"
              />
            </div>
          </div>
          {casesStatus === "loading" && <p className="font-body text-sm text-[#d1c5b4]">Loading docket…</p>}
          {casesStatus === "error" && (
            <div className="space-y-3">
              <p className="font-body text-sm text-[#d1c5b4]">Couldn&apos;t load cases. Check your connection.</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => void loadDocket()}>
                Retry
              </Button>
            </div>
          )}
          {casesStatus === "ready" && (
            <>
              <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCases.map((c) => (
                  <li key={c.id}>
                    <div className="parchment-texture flex min-h-[220px] flex-col justify-between rounded-sm p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1">
                      <div>
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <span className="font-label text-[9px] font-bold uppercase tracking-widest text-[#3f3b31]/80">
                            Case ID: {syntheticCaseRef(c.id, c.tier)}
                          </span>
                          <button
                            type="button"
                            className="text-[#343026]/40 hover:text-[#343026]/70"
                            aria-label="Bookmark (decorative)"
                          >
                            <Bookmark className="size-5" />
                          </button>
                        </div>
                        <h4 className="font-heading mb-2 text-2xl font-bold text-[#343026]">{c.title}</h4>
                        <p className="font-body line-clamp-2 text-sm text-[#343026]/70">
                          {truncateBrief(c.briefSummary, 140)}
                        </p>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-[#343026]/10 pt-4">
                        <span className="font-label text-[10px] font-semibold uppercase text-[#343026]/50">
                          Difficulty: {DIFFICULTY[c.tier] ?? `Tier ${c.tier}`}
                        </span>
                        {session?.user ? (
                          <Link
                            href={`/case/${c.id}`}
                            className="font-label text-xs font-bold uppercase tracking-widest text-[#343026] underline underline-offset-4 transition-colors hover:text-[#c5a059]"
                          >
                            Open Case
                          </Link>
                        ) : (
                          <span className="font-label text-xs text-[#343026]/50">Sign in to play</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {!cases.length && (
                <p className="font-body text-sm text-[#d1c5b4]">
                  No cases in database. Run <code className="rounded bg-[#2a2a2a] px-1 py-0.5 text-xs">npx prisma migrate deploy</code> and{" "}
                  <code className="rounded bg-[#2a2a2a] px-1 py-0.5 text-xs">npm run db:seed</code>.
                </p>
              )}
              {cases.length > 0 && filteredCases.length === 0 && (
                <p className="font-body text-sm text-[#d1c5b4]">No cases match your search.</p>
              )}
            </>
          )}
        </section>

        <footer className="border-t border-[#4e4639]/40 pt-6 font-label text-xs text-[#d1c5b4]/70 lg:col-span-12">
          Educational game — not legal advice. Briefing, evidence, library, ruling, reveal.
        </footer>
      </div>
      <MobileHomeNav />
    </div>
  );

  return (
    <JudicialShell sidebar={<AppSidebarHome active="docket" />} sovereignLayout>
      {main}
    </JudicialShell>
  );
}
