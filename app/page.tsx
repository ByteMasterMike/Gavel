"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CaseLibraryPanel } from "@/components/home/CaseLibraryPanel";
import { DocketGreeting } from "@/components/home/DocketGreeting";
import { SignInCallout } from "@/components/home/SignInCallout";
import { SignedInDocketRow } from "@/components/home/SignedInDocketRow";
import { syntheticCaseRef } from "@/components/home/docketUtils";
import type { CaseRow, DailySummary } from "@/components/home/types";
import { fetchOkJson } from "@/lib/fetchWithRetry";
import { JudicialShell, SOVEREIGN_HEADER_PT } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { MobileHomeNav } from "@/components/shell/MobileHomeNav";

type DailyPayload = {
  daily?: DailySummary | null;
};

type CasesPayload = { cases: CaseRow[] };

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

  const greetingName =
    session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "Justice";

  const pendingCount = session?.user ? cases.length : 0;
  const heroSubline =
    session?.user && casesStatus === "ready"
      ? pendingCount > 0
        ? `The Supreme Court awaits your deliberation. ${pendingCount} case${pendingCount === 1 ? "" : "s"} ${pendingCount === 1 ? "is" : "are"} pending for review today.`
        : "The Supreme Court awaits your deliberation. Your docket is clear — pick up the Morning Docket or browse the archives."
      : "The court awaits your deliberation. Pick up the Morning Docket or open a case from the library.";

  if (status === "loading") {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="docket" />} sovereignLayout>
        <div className={cn(SOVEREIGN_HEADER_PT, "mx-auto max-w-7xl px-6 py-12 lg:px-12")}>
          <p className="font-body text-[#d1c5b4]" role="status">
            Loading…
          </p>
        </div>
        <MobileHomeNav />
      </JudicialShell>
    );
  }

  return (
    <JudicialShell sidebar={<AppSidebarHome active="docket" />} sovereignLayout>
      <div className={cn(SOVEREIGN_HEADER_PT, "mx-auto max-w-7xl px-6 pb-28 md:pb-12 lg:px-12")}>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <DocketGreeting greetingName={greetingName} heroSubline={heroSubline} />

          {session?.user && <SignedInDocketRow userId={session.user.id ?? "user"} daily={daily} />}

          {!session?.user && <SignInCallout />}

          <CaseLibraryPanel
            libraryQuery={libraryQuery}
            onLibraryQueryChange={setLibraryQuery}
            casesStatus={casesStatus}
            filteredCases={filteredCases}
            cases={cases}
            session={session}
            onRetryLoad={loadDocket}
          />

          <footer className="border-t border-[#4e4639]/40 pt-6 font-label text-xs text-[#d1c5b4]/70 lg:col-span-12">
            Educational game — not legal advice. Briefing, evidence, library, ruling, reveal.
          </footer>
        </div>
        <MobileHomeNav />
      </div>
    </JudicialShell>
  );
}
