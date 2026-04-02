"use client";

import { AppHeader } from "./AppHeader";

/** Header + optional fixed sidebar clearance (Sovereign Scholar layout). */
export const SOVEREIGN_HEADER_PT = "pt-24";

const skipLinkClassName =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function SkipToMainLink() {
  return (
    <a href="#main-content" className={skipLinkClassName}>
      Skip to main content
    </a>
  );
}

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
        <SkipToMainLink />
        {!hideHeader && <AppHeader />}
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[288px] shrink-0 lg:block" aria-label="Section navigation">
            {sidebar}
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              <main
                id="main-content"
                tabIndex={-1}
                className="min-w-0 flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {children}
              </main>
              {rightRail ? (
                <aside
                  className="hidden w-[min(100%,320px)] shrink-0 border-l border-border bg-card/90 backdrop-blur xl:block"
                  aria-label="Secondary panel"
                >
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
      <SkipToMainLink />
      {!hideHeader && <AppHeader variant="sovereign" />}
      <div className="flex min-h-0 flex-1">
        <aside
          className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 overflow-y-auto md:block"
          aria-label="Dashboard navigation"
        >
          {sidebar}
        </aside>
        <div className="hidden w-64 shrink-0 md:block" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <main
              id="main-content"
              tabIndex={-1}
              className="min-w-0 flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {children}
            </main>
            {rightRail ? (
              <aside
                className="hidden w-[min(100%,320px)] shrink-0 border-l border-border bg-card/90 backdrop-blur xl:block"
                aria-label="Secondary panel"
              >
                {rightRail}
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
