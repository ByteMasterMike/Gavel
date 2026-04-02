"use client";

import Link from "next/link";
import { Bookmark, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Session } from "next-auth";
import type { CaseRow } from "./types";
import { DIFFICULTY, syntheticCaseRef, truncateBrief } from "./docketUtils";

type CasesStatus = "loading" | "ready" | "error";

type Props = {
  libraryQuery: string;
  onLibraryQueryChange: (value: string) => void;
  casesStatus: CasesStatus;
  filteredCases: CaseRow[];
  cases: CaseRow[];
  session: Session | null;
  onRetryLoad: () => void;
};

export function CaseLibraryPanel({
  libraryQuery,
  onLibraryQueryChange,
  casesStatus,
  filteredCases,
  cases,
  session,
  onRetryLoad,
}: Props) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLibraryQueryChange(e.target.value);
  };

  const handleRetryClick = () => {
    onRetryLoad();
  };

  return (
    <section id="case-library" className="mt-4 scroll-mt-28 lg:col-span-12" aria-labelledby="case-library-heading">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9c176]">Archives</span>
          <h2 id="case-library-heading" className="font-heading mt-1 text-3xl text-[#e5e2e1]">
            Case Library
          </h2>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#d1c5b4]/40" aria-hidden />
          <Input
            type="search"
            placeholder="Search archives..."
            value={libraryQuery}
            onChange={handleSearchChange}
            className="h-11 rounded border-none bg-[#2a2a2a] py-3 pl-10 pr-4 font-label text-sm text-[#e5e2e1] placeholder:text-[#d1c5b4]/50 focus-visible:ring-1 focus-visible:ring-[#e9c176]"
            aria-label="Search case library"
            autoComplete="off"
          />
        </div>
      </div>

      {casesStatus === "loading" && (
        <p className="font-body text-sm text-[#d1c5b4]" role="status">
          Loading docket…
        </p>
      )}

      {casesStatus === "error" && (
        <div className="space-y-3" role="alert">
          <p className="font-body text-sm text-[#d1c5b4]">Couldn&apos;t load cases. Check your connection.</p>
          <Button type="button" size="sm" variant="secondary" onClick={handleRetryClick}>
            Retry
          </Button>
        </div>
      )}

      {casesStatus === "ready" && (
        <>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((c) => (
              <li key={c.id}>
                <article className="parchment-texture flex min-h-[220px] flex-col justify-between rounded-sm p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1">
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
                        <Bookmark className="size-5" aria-hidden />
                      </button>
                    </div>
                    <h3 className="font-heading mb-2 text-2xl font-bold text-[#343026]">{c.title}</h3>
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
                </article>
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
  );
}
