"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchOkJson } from "@/lib/fetchWithRetry";

type Entry = {
  rank: number;
  userId: string;
  displayName: string;
  image: string | null;
  totalScore: number;
};

type Payload = {
  date: string;
  caseId: string | null;
  caseTitle: string | null;
  entries: Entry[];
  me: { rank: number; totalScore: number; displayName: string } | null;
};

export function DailyLeaderboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetchOkJson<Payload>("/api/leaderboard/daily");
      if (cancelled) return;
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setData(res.data);
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <Card className="border-primary/25 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg text-primary">
            <Trophy className="size-5 text-primary" />
            Daily leaderboard
          </CardTitle>
          <CardDescription>Best score per judge on today&apos;s Morning Docket case.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (status === "error" || !data) {
    return (
      <Card className="border-primary/25 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg text-primary">
            <Trophy className="size-5 text-primary" />
            Daily leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Couldn&apos;t load rankings. Try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data.caseId || !data.caseTitle) {
    return null;
  }

  return (
    <Card className="border-primary/25 bg-card/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-lg text-primary">
          <Trophy className="size-5 text-primary" />
          Daily leaderboard
        </CardTitle>
        <CardDescription>
          Today&apos;s case: <span className="text-foreground/90">{data.caseTitle}</span>. One entry per
          judge (your best score today).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.me && (
          <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            Your standing: <span className="font-semibold">#{data.me.rank}</span> —{" "}
            {data.me.totalScore.toLocaleString()} pts
          </p>
        )}
        {data.entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No scored rulings yet today. Be the first on the docket.
          </p>
        ) : (
          <ol className="space-y-2 text-sm">
            {data.entries.map((e) => (
              <li
                key={e.userId}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-8 shrink-0 tabular-nums text-muted-foreground">#{e.rank}</span>
                  {e.image ? (
                    <img
                      src={e.image}
                      alt=""
                      className="size-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {e.displayName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate font-medium">{e.displayName}</span>
                </div>
                <span className="shrink-0 tabular-nums font-semibold">{e.totalScore.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
