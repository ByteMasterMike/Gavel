"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileHomeNav() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-[#e9c176]/5 bg-[#131313]/90 px-4 pt-3 pb-6 shadow-[0_-10px_25px_rgba(0,0,0,0.6)] backdrop-blur-md md:hidden"
      aria-label="Mobile dashboard"
    >
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 font-label text-[10px] font-bold uppercase tracking-tighter",
          onHome ? "scale-110 text-[#e9c176]" : "text-[#d1c5b4]/40 hover:text-[#e9c176]/80",
        )}
      >
        <ClipboardList className="size-6" />
        Docket
      </Link>
      <Link
        href="/#case-library"
        className="flex flex-col items-center justify-center gap-0.5 font-label text-[10px] font-bold uppercase tracking-tighter text-[#d1c5b4]/40 hover:text-[#e9c176]/80"
      >
        <BookOpen className="size-6" />
        Library
      </Link>
      <Link
        href="/#progress"
        className="flex flex-col items-center justify-center gap-0.5 font-label text-[10px] font-bold uppercase tracking-tighter text-[#d1c5b4]/40 hover:text-[#e9c176]/80"
      >
        <TrendingUp className="size-6" />
        Progress
      </Link>
      <Link
        href="/hall"
        className="flex flex-col items-center justify-center gap-0.5 font-label text-[10px] font-bold uppercase tracking-tighter text-[#d1c5b4]/40 hover:text-[#e9c176]/80"
      >
        <Wallet className="size-6" />
        Profile
      </Link>
    </nav>
  );
}
