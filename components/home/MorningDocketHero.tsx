import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySummary } from "./types";
import { truncateBrief } from "./docketUtils";

const MORNING_DOCKET_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBpWEgRHZK4BhNKKMQTwL2bQKpxCS6wmXY7bcU6K4LE1TIsyeXmIk0PinY1Mj_1JFFQDDQC8Lz8j_CZjGmgms7ZDMvahc_L6Xlg_HSvFm8kmUt8f-uCRwyWMPqAe5Fi7c3k6uG8zWYrUKAG4By2CMlEffW0R6_tGO6ZnZyXcNlyt4hL2DiyfDWyJg1Btxf9DdO9EVokOqJb5-iild0CxPcDKoVQNKiu0TaR4chELsdYrqXwlHs---IMmU2DJiaBfN60cUY51gmxgsZ-";

type Props = {
  daily: DailySummary | null;
};

export function MorningDocketHero({ daily }: Props) {
  const dailyId = daily?.case?.id ?? null;
  const dailyTitle = daily?.case?.title ?? "Today’s case";
  const dailyTier = daily?.case?.tier ?? 1;
  const dailyBrief = daily?.case?.briefSummary
    ? truncateBrief(daily.case.briefSummary)
    : null;

  if (!dailyId) {
    return (
      <Card className="border-dashed border-[#4e4639] bg-[#201f1f]/80">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-[#e5e2e1]">Morning docket</CardTitle>
          <CardDescription className="text-[#d1c5b4]">No daily challenge is configured yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-lg shadow-2xl mahogany-texture">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex flex-col items-center gap-8 p-6 md:flex-row md:items-stretch md:gap-10 md:p-10">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-white/5 shadow-2xl md:w-1/3">
          <Image
            src={MORNING_DOCKET_IMAGE}
            alt=""
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (min-width: 1024px) 320px, 33vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" aria-hidden />
          {dailyTier >= 3 && (
            <span className="absolute bottom-4 left-4 rounded bg-[#ffb3ac] px-2 py-1 font-label text-[10px] font-medium text-[#611111]">
              High Stakes
            </span>
          )}
        </div>
        <div className="relative z-10 flex flex-1 flex-col text-center md:text-left">
          <span className="font-label mb-3 block text-[10px] uppercase tracking-[0.3em] text-[#e9c176]">
            Morning Docket Challenge
          </span>
          <h2 className="font-heading mb-4 text-3xl font-bold italic leading-tight text-white md:text-4xl">
            {dailyTitle}
          </h2>
          <p className="font-body mb-8 max-w-md text-[#d1c5b4]/80 leading-relaxed">
            {dailyBrief ??
              "A landmark case on the docket today. Weigh the evidence and deliver your verdict before the session adjourns."}
          </p>
          <Link
            href={`/case/${dailyId}`}
            className={cn(
              "mx-auto inline-flex items-center gap-3 rounded px-8 py-4 font-label text-sm font-bold uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-[0.98] md:mx-0",
              "bg-[#e9c176] text-[#412d00] hover:bg-[#c5a059]",
            )}
          >
            Play Today&apos;s Case
            <Play className="size-4 fill-current" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
