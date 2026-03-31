"use client";

import { AppHeader } from "./AppHeader";

/** Header + optional fixed sidebar clearance (Sovereign Scholar layout). */
export const SOVEREIGN_HEADER_PT = "pt-24";

export function JudicialShell({
  sidebar,
  children,
  rightRail,
  hideHeader,
  /** When true, sidebar is fixed left (md+) with main offset; use for home dashboard. */
  sovereignLayout,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
  hideHeader?: boolean;
  sovereignLayout?: boolean;
}) {
  if (!sovereignLayout) {
    return (
      <div className="flex min-h-full flex-col bg-background">
        {!hideHeader && <AppHeader />}
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[288px] shrink-0 lg:block">{sidebar}</aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              <div className="min-w-0 flex-1 overflow-auto">{children}</div>
              {rightRail ? (
                <aside className="hidden w-[min(100%,320px)] shrink-0 border-l border-border bg-card/90 backdrop-blur xl:block">
                  {rightRail}
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      {!hideHeader && <AppHeader variant="sovereign" />}
      <div className="flex min-h-0 flex-1">
        <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 md:block" aria-hidden={false}>
          {sidebar}
        </aside>
        <div className="hidden w-64 shrink-0 md:block" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 overflow-auto">{children}</div>
            {rightRail ? (
              <aside className="hidden w-[min(100%,320px)] shrink-0 border-l border-border bg-card/90 backdrop-blur xl:block">
                {rightRail}
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
