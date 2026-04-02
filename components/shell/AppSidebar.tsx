"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Scale,
  LayoutDashboard,
  BookOpen,
  Archive,
  Settings,
  FolderOpen,
  FileText,
  HelpCircle,
  Plus,
  Presentation,
  CalendarDays,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { GamePhase } from "@/types";

type MeUser = {
  tierTitle: string;
  name: string | null;
  email: string | null;
};

type HomeNavId = "docket" | "library" | "classroom" | "chambers" | "archives" | "settings";

function SovereignNavLink({
  href,
  active,
  icon: Icon,
  className,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-6 py-4 font-label text-xs font-medium uppercase tracking-widest transition-all duration-200",
        active
          ? "border-l-4 border-[#e9c176] bg-gradient-to-r from-[#c5a059]/20 to-transparent text-[#e9c176]"
          : "border-l-4 border-transparent text-[#d1c5b4]/60 hover:bg-[#201f1f] hover:text-[#d1c5b4]",
        className,
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-[22px] shrink-0" aria-hidden />
      {children}
    </Link>
  );
}

function SidebarNavItem({
  href,
  active,
  icon: Icon,
  children,
  onClick,
}: {
  href?: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const cls = cn(
    "relative flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-left text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-primary"
      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
  );
  const inner = (
    <>
      {active && <span className="absolute right-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-l bg-primary" />}
      <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      <span className="uppercase tracking-wide">{children}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-current={active ? "true" : undefined}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={href!} className={cls} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  );
}

export function AppSidebarHome({ active }: { active: HomeNavId }) {
  const [me, setMe] = useState<MeUser | null>(null);

  useEffect(() => {
    let c = false;
    void (async () => {
      const res = await fetch("/api/me");
      if (!res.ok || c) return;
      const j = (await res.json()) as { user: (MeUser & { tierTitle: string }) | null };
      if (!c && j.user) setMe(j.user);
    })();
    return () => {
      c = true;
    };
  }, []);

  const display = me?.name?.trim() || me?.email?.split("@")[0] || "Sovereign Scholar";
  const role = me?.tierTitle ?? "Senior Associate";

  return (
    <div className="flex h-full flex-col border-r border-[#e9c176]/10 bg-[#1c1b1b] pb-8 pt-24 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="mb-8 px-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#c5a059]">
            <Scale className="size-4 text-[#4e3700]" />
          </div>
          <span className="truncate font-heading text-xl text-[#e9c176]">{display}</span>
        </div>
        <p className="font-label text-xs font-medium uppercase tracking-widest text-[#d1c5b4]/60">{role}</p>
      </div>
      <nav className="flex flex-1 flex-col font-label" aria-label="Docket navigation">
        <SovereignNavLink href="/" active={active === "docket"} icon={CalendarDays}>
          Docket
        </SovereignNavLink>
        <SovereignNavLink href="/#case-library" active={active === "library"} icon={BookOpen}>
          Library
        </SovereignNavLink>
        <SovereignNavLink href="/classroom" active={active === "classroom"} icon={Presentation}>
          Classroom
        </SovereignNavLink>
        <SovereignNavLink href="/hall" active={active === "chambers"} icon={Scale}>
          Chambers
        </SovereignNavLink>
        <SovereignNavLink href="/#case-library" active={active === "archives"} icon={History}>
          Archives
        </SovereignNavLink>
        <SovereignNavLink href="#" active={active === "settings"} icon={Settings} className="mt-auto">
          Settings
        </SovereignNavLink>
      </nav>
      <div className="mt-8 px-6">
        <Link
          href="/#case-library"
          className={cn(
            "flex w-full items-center justify-center rounded py-4 font-label text-xs font-bold uppercase tracking-widest shadow-lg transition-all active:scale-[0.98]",
            "bg-gradient-to-r from-[#e9c176] to-[#c5a059] text-[#412d00]",
          )}
        >
          New Case File
        </Link>
      </div>
    </div>
  );
}

const PHASE_TO_TRIAL: Record<GamePhase, "evidence" | "casefiles" | "exhibits" | "prior" | null> = {
  briefing: "casefiles",
  evidence: "evidence",
  library: "exhibits",
  ruling: "prior",
};

export function AppSidebarTrial({
  phase,
  onPhaseNavigate,
}: {
  phase: GamePhase;
  /** Only phases at or before current progress are reachable (matches in-case nav). */
  onPhaseNavigate: (p: GamePhase) => void;
}) {
  const [me, setMe] = useState<MeUser | null>(null);
  const trialActive = PHASE_TO_TRIAL[phase];

  useEffect(() => {
    let c = false;
    void (async () => {
      const res = await fetch("/api/me");
      if (!res.ok || c) return;
      const j = (await res.json()) as { user: MeUser & { tierTitle: string } | null };
      if (!c && j.user) setMe(j.user);
    })();
    return () => {
      c = true;
    };
  }, []);

  const display = me?.name?.trim() || me?.email?.split("@")[0] || "Scholar";
  const role = me?.tierTitle ?? "District Judge";

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar py-6">
      <div className="px-6 pb-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded border border-primary/30 bg-sidebar-accent">
            <Scale className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{display}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{role}</p>
          </div>
        </div>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-5 w-full gap-2 border-primary/50 text-primary hover:bg-primary/10",
          )}
        >
          <Plus className="size-4" />
          New docket item
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Trial navigation">
        <SidebarNavItem
          icon={FolderOpen}
          active={trialActive === "evidence"}
          onClick={() => onPhaseNavigate("evidence")}
        >
          Evidence locker
        </SidebarNavItem>
        <SidebarNavItem
          icon={FileText}
          active={trialActive === "casefiles"}
          onClick={() => onPhaseNavigate("briefing")}
        >
          Case files
        </SidebarNavItem>
        <SidebarNavItem
          icon={Scale}
          active={trialActive === "exhibits"}
          onClick={() => onPhaseNavigate("library")}
        >
          Exhibits
        </SidebarNavItem>
        <SidebarNavItem
          icon={Archive}
          active={trialActive === "prior"}
          onClick={() => onPhaseNavigate("ruling")}
        >
          Prior rulings
        </SidebarNavItem>
      </nav>
      <div className="mt-auto space-y-1 border-t border-sidebar-border px-3 pt-4">
        <SidebarNavItem href="#" icon={Settings} active={false}>
          Settings
        </SidebarNavItem>
        <SidebarNavItem href="#" icon={HelpCircle} active={false}>
          Support
        </SidebarNavItem>
      </div>
    </div>
  );
}

export function AppSidebarResults() {
  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar py-6">
      <div className="px-6">
        <Link href="/" className="font-heading text-lg text-primary">
          THE GAVEL
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">Case record</p>
      </div>
      <nav className="mt-8 flex flex-col gap-1 px-3">
        <SidebarNavItem href="/" icon={LayoutDashboard} active={false}>
          Return to docket
        </SidebarNavItem>
      </nav>
    </div>
  );
}
