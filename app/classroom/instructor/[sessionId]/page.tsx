"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, Download, RefreshCw } from "lucide-react";

type DashboardPayload = {
  session: { id: string; title: string; roomCode: string; caseTitle: string };
  verdictCounts: Record<string, number>;
  flagTotal: number;
  citedHistogram: { id: string; count: number; label: string }[];
  participants: { userId: string; displayName: string; isAnonymous: boolean; joinedAt: string }[];
  rulings: {
    id: string;
    displayLabel: string;
    isAnonymous: boolean;
    verdict: string;
    totalScore: number | null;
    status: string;
    submittedAt: string;
    citedCount: number;
    flagsCount: number;
  }[];
  dissents: {
    id: string;
    author: string;
    text: string;
    status: string;
    instructorComment: string | null;
  }[];
};

export default function InstructorDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/classroom/sessions/${sessionId}/dashboard`);
    if (res.status === 403 || res.status === 404) {
      const j = (await res.json()) as { error?: string };
      setErr(j.error ?? "Could not load dashboard");
      setData(null);
      return;
    }
    if (!res.ok) {
      setErr("Could not load dashboard");
      return;
    }
    setErr(null);
    setData((await res.json()) as DashboardPayload);
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(id);
  }, []);

  const patchDissent = async (id: string, statusArg: "APPROVED" | "DECLINED") => {
    const res = await fetch(`/api/classroom/dissents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusArg }),
    });
    if (res.ok) void load();
  };

  if (status === "loading") {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
        <p className="p-8 text-center text-muted-foreground">Loading…</p>
      </JudicialShell>
    );
  }

  if (!session?.user) {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
        <div className="p-8">
          <Button type="button" onClick={() => signIn("google", { callbackUrl: `/classroom/instructor/${sessionId}` })}>
            Sign in
          </Button>
        </div>
      </JudicialShell>
    );
  }

  if (err && !data) {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
        <div className="mx-auto max-w-md space-y-4 p-8">
          <p className="text-destructive">{err}</p>
          <Button type="button" variant="outline" onClick={() => router.push("/classroom")}>
            Classroom home
          </Button>
        </div>
      </JudicialShell>
    );
  }

  if (!data) {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
        <p className="p-8 text-center text-muted-foreground">Loading dashboard…</p>
      </JudicialShell>
    );
  }

  const s = data.session;
  const verdictEntries = Object.entries(data.verdictCounts).sort((a, b) => b[1] - a[1]);

  return (
    <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary">Instructor dashboard</p>
            <h1 className="font-heading text-2xl font-semibold md:text-3xl">{s.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Case: {s.caseTitle} · Room code{" "}
              <span className="font-mono font-semibold text-foreground">{s.roomCode}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <a
              href={`/api/classroom/sessions/${sessionId}/export`}
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "inline-flex gap-1")}
            >
              <Download className="size-4" />
              CSV
            </a>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Auto-refresh about every 4 seconds.</p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Verdict distribution (scored)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {verdictEntries.length === 0 ? (
                <p className="text-muted-foreground">No scored rulings yet.</p>
              ) : (
                verdictEntries.map(([v, n]) => (
                  <div key={v} className="flex justify-between gap-2">
                    <span className="truncate text-muted-foreground">{v.replaceAll("_", " ")}</span>
                    <span className="tabular-nums font-medium">{n}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Flags raised</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-semibold tabular-nums text-primary">{data.flagTotal}</p>
              <p className="text-xs text-muted-foreground">Total flagged documents across submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Activity className="size-3" />
                Participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-semibold">{data.participants.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cited precedent frequency</CardTitle>
          </CardHeader>
          <CardContent>
            {data.citedHistogram.length === 0 ? (
              <p className="text-sm text-muted-foreground">No citations yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.citedHistogram.map((h) => (
                  <li key={h.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate text-muted-foreground">{h.label}</span>
                    <span className="shrink-0 tabular-nums">{h.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rulings</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 pr-2">Participant</th>
                  <th className="pb-2 pr-2">Verdict</th>
                  <th className="pb-2 pr-2">Score</th>
                  <th className="pb-2 pr-2">Cites</th>
                  <th className="pb-2">Flags</th>
                </tr>
              </thead>
              <tbody>
                {data.rulings.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-2">
                      {r.displayLabel}
                      {r.isAnonymous && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          Anon
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 pr-2">{r.verdict.replaceAll("_", " ")}</td>
                    <td className="py-2 pr-2 tabular-nums">{r.totalScore ?? "—"}</td>
                    <td className="py-2 pr-2">{r.citedCount}</td>
                    <td className="py-2">{r.flagsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dissents</CardTitle>
            <CardDescription>Approve to grant the Distinguished Dissenter classroom badge (once per student per session).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.dissents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dissents yet.</p>
            ) : (
              data.dissents.map((d) => (
                <div key={d.id} className="rounded-lg border border-border/60 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{d.author}</span>
                    <Badge variant={d.status === "PENDING" ? "secondary" : "outline"}>{d.status}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{d.text}</p>
                  {d.instructorComment && (
                    <p className="mt-2 text-xs text-primary">Note: {d.instructorComment}</p>
                  )}
                  {d.status === "PENDING" && (
                    <div className="mt-3 flex gap-2">
                      <Button type="button" size="sm" onClick={() => void patchDissent(d.id, "APPROVED")}>
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void patchDissent(d.id, "DECLINED")}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/classroom" className={cn(buttonVariants({ variant: "outline" }))}>
            Classroom home
          </Link>
        </div>
      </div>
    </JudicialShell>
  );
}
