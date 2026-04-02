"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItemClass = (active: boolean) =>
  cn(
    "flex min-h-11 min-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-md font-label text-[10px] font-bold uppercase tracking-tighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9c176] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131313]",
    active ? "scale-110 text-[#e9c176]" : "text-[#d1c5b4]/40 hover:text-[#e9c176]/80",
  );

export function MobileHomeNav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onHall = pathname === "/hall";

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-[#e9c176]/5 bg-[#131313]/90 px-4 pt-3 pb-6 shadow-[0_-10px_25px_rgba(0,0,0,0.6)] backdrop-blur-md md:hidden"
      aria-label="Mobile dashboard"
    >
      <Link href="/" className={navItemClass(onHome)} aria-current={onHome ? "page" : undefined}>
        <ClipboardList className="size-6 shrink-0" aria-hidden />
        Docket
      </Link>
      <Link href="/#case-library" className={navItemClass(false)}>
        <BookOpen className="size-6 shrink-0" aria-hidden />
        Library
      </Link>
      <Link href="/#progress" className={navItemClass(false)}>
        <TrendingUp className="size-6 shrink-0" aria-hidden />
        Progress
      </Link>
      <Link href="/hall" className={navItemClass(onHall)} aria-current={onHall ? "page" : undefined}>
        <Wallet className="size-6 shrink-0" aria-hidden />
        Hall
      </Link>
    </nav>
  );
}
