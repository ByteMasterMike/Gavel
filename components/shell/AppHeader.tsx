"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bell, Gavel, Moon, Scale, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MeHeader = {
  tierTitle: string;
  careerPoints: number;
};

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

export function AppHeader({ variant = "default" }: { variant?: "default" | "sovereign" }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [me, setMe] = useState<MeHeader | null>(null);

  useEffect(() => {
    if (variant !== "sovereign" || !session?.user) return;
    let c = false;
    void (async () => {
      const res = await fetch("/api/me");
      if (!res.ok || c) return;
      const j = (await res.json()) as { user: MeHeader | null };
      if (!c && j.user) setMe(j.user);
    })();
    return () => {
      c = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on user id only to avoid session object churn
  }, [variant, session?.user?.id]);

  const headerMe = variant === "sovereign" && session?.user ? me : null;

  const onHall = pathname === "/hall";
  const onClassroom = pathname.startsWith("/classroom");
  const onHome = pathname === "/";

  if (variant === "sovereign") {
    return (
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#131313] px-6 py-4 shadow-2xl shadow-black/40">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="shrink-0 font-heading text-2xl font-bold italic tracking-tight text-[#e9c176]"
          >
            The Gavel
          </Link>
          {headerMe && (
            <div className="hidden items-center gap-6 border-l border-[#4e4639]/80 pl-6 md:flex">
              <div className="flex flex-col">
                <span className="font-label text-[10px] font-medium uppercase tracking-widest text-[#d1c5b4]/60">
                  Judge rank
                </span>
                <span className="font-heading text-base font-bold text-[#e9c176]">{headerMe.tierTitle}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label text-[10px] font-medium uppercase tracking-widest text-[#d1c5b4]/60">
                  Career points
                </span>
                <span className="font-heading text-base font-bold text-[#e9c176]">
                  {headerMe.careerPoints.toLocaleString()} CP
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/hall"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "size-10 rounded-lg text-[#e9c176] hover:bg-[#393939]",
            )}
            aria-label="The Hall"
          >
            <Gavel className="size-5" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-10 rounded-lg text-[#e9c176] hover:bg-[#393939]"
            aria-label="Notifications (coming soon)"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[#ffb3ac]" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 text-[#d1c5b4] hover:bg-[#393939] hover:text-[#e9c176]"
            aria-label="Toggle light or dark theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          {status === "loading" ? (
            <span className="text-xs text-[#d1c5b4]">…</span>
          ) : session?.user ? (
            <div className="flex items-center gap-2 pl-1">
              {session.user.image ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="size-10 overflow-hidden rounded-lg border border-[#e9c176]/20 bg-[#201f1f] transition-opacity hover:opacity-90"
                  aria-label="Sign out"
                >
                  <Image
                    src={session.user.image}
                    alt=""
                    width={40}
                    height={40}
                    className="size-full object-cover"
                    unoptimized
                  />
                </button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-[#d1c5b4] hover:text-[#e9c176]"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {process.env.NODE_ENV === "development" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-[#4e4639] text-[#e5e2e1]"
                  onClick={() => signIn("dev", { callbackUrl: pathname || "/" })}
                >
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

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
      <div className="flex min-w-0 items-center gap-8">
        <Link href="/" className="font-heading text-xl font-semibold tracking-tight text-primary md:text-2xl">
          The Gavel
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
            <span className="tabular-nums">Signed in</span>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground"
          aria-label="Toggle light or dark theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
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
