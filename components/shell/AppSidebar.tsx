"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Scale,
  LayoutDashboard,
  BookOpen,
  Gavel,
  Archive,
  Settings,
  FolderOpen,
  FileText,
  HelpCircle,
  Plus,
  Presentation,
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
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={href!} className={cls}>
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

  const display = me?.name?.trim() || me?.email?.split("@")[0] || "Scholar";
  const role = me?.tierTitle ?? "Judge";

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
          className={cn(buttonVariants(), "mt-5 w-full gap-2 border border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90")}
        >
          <Plus className="size-4" />
          New case file
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Docket navigation">
        <SidebarNavItem href="/" icon={LayoutDashboard} active={active === "docket"}>
          Docket
        </SidebarNavItem>
        <SidebarNavItem href="/#case-library" icon={BookOpen} active={active === "library"}>
          Library
        </SidebarNavItem>
        <SidebarNavItem href="/classroom" icon={Presentation} active={active === "classroom"}>
          Classroom
        </SidebarNavItem>
        <SidebarNavItem href="/hall" icon={Gavel} active={active === "chambers"}>
          Chambers
        </SidebarNavItem>
        <SidebarNavItem href="/#case-library" icon={Archive} active={active === "archives"}>
          Archives
        </SidebarNavItem>
      </nav>
      <div className="mt-auto space-y-1 border-t border-sidebar-border px-3 pt-4">
        <SidebarNavItem href="#" icon={Settings} active={active === "settings"}>
          Settings
        </SidebarNavItem>
        <SidebarNavItem href="#" icon={HelpCircle} active={false}>
          Support
        </SidebarNavItem>
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
