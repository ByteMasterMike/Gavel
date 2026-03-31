"use client";

import { AppHeader } from "./AppHeader";

export function JudicialShell({
  sidebar,
  children,
  rightRail,
  hideHeader,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
  hideHeader?: boolean;
}) {
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
