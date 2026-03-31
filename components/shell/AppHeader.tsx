"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Clock, Type, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-xs font-medium uppercase tracking-widest transition-colors",
        active ? "text-primary underline decoration-primary underline-offset-4" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const onHall = pathname === "/hall";
  const onClassroom = pathname === "/classroom";
  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
      <div className="flex min-w-0 items-center gap-8">
        <Link href="/" className="font-heading text-xl font-semibold tracking-tight text-primary md:text-2xl">
          THE GAVEL
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <NavLink href="/hall" active={onHall}>
            The Supreme 9 Hall
          </NavLink>
          <NavLink href="/#case-library" active={onHome}>
            The Law Library
          </NavLink>
          <NavLink href="/classroom" active={onClassroom}>
            Classroom
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {session?.user && (
          <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <Clock className="size-3.5 text-primary" aria-hidden />
            <span className="tabular-nums">Session</span>
          </div>
        )}
        <Button type="button" variant="ghost" size="icon" className="hidden size-9 text-muted-foreground sm:inline-flex" aria-label="Text size">
          <Type className="size-4" />
        </Button>
        {status === "loading" ? (
          <span className="text-xs text-muted-foreground">…</span>
        ) : session?.user ? (
          <div className="flex items-center gap-2">
            <div
              className="flex size-9 items-center justify-center rounded-full border border-primary/40 bg-secondary"
              aria-hidden
            >
              <Scale className="size-4 text-primary" />
            </div>
            <Button type="button" variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {process.env.NODE_ENV === "development" && (
              <Button type="button" size="sm" variant="outline" onClick={() => signIn("dev", { callbackUrl: pathname || "/" })}>
                Dev
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => signIn("google", { callbackUrl: pathname || "/" })}>
              Sign in
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
