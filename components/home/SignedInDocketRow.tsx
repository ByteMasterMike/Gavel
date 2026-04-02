"use client";

import { CareerSection } from "@/components/home/CareerSection";
import { DailyLeaderboard } from "@/components/home/DailyLeaderboard";
import { MorningDocketHero } from "@/components/home/MorningDocketHero";
import type { DailySummary } from "./types";

type Props = {
  userId: string;
  daily: DailySummary | null;
};

export function SignedInDocketRow({ userId, daily }: Props) {
  return (
    <div id="progress" className="scroll-mt-28 space-y-8 lg:col-span-12 lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0">
      <div className="lg:col-span-4">
        <CareerSection key={userId} />
      </div>
      <div className="flex flex-col gap-8 lg:col-span-8">
        <MorningDocketHero daily={daily} />
        <DailyLeaderboard />
      </div>
    </div>
  );
}
