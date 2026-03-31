"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, GraduationCap, Hash } from "lucide-react";

type CaseRow = { id: string; title: string; tier: number; category: string };

export default function ClassroomHubPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [title, setTitle] = useState("Class session");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/cases");
      if (!res.ok || cancelled) return;
      const j = (await res.json()) as { cases: CaseRow[] };
      const list = j.cases ?? [];
      setCases(list);
      setCaseId((prev) => prev || list[0]?.id || "");
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const createSession = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/classroom/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, title }),
      });
      const j = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not create session");
        return;
      }
      if (j.id) router.push(`/classroom/instructor/${j.id}`);
    } finally {
      setBusy(false);
    }
  };

  const goJoin = () => {
    const c = codeInput.trim().toUpperCase();
    if (c.length < 4) {
      setErr("Enter a room code");
      return;
    }
    router.push(`/classroom/session/${c}`);
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
        <div className="mx-auto flex max-w-md flex-col gap-4 p-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Sign in for classroom</CardTitle>
              <CardDescription>Instructors and students need an account to host or join a session.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {process.env.NODE_ENV === "development" && (
                <Button type="button" onClick={() => signIn("dev", { callbackUrl: "/classroom" })}>
                  Dev sign-in
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={() => signIn("google", { callbackUrl: "/classroom" })}>
                Continue with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </JudicialShell>
    );
  }

  return (
    <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Classroom mode</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">Host or join a session</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Instructors pick a case and share a room code. Students join, then open the case with the session link so
            rulings attach to your room. The instructor dashboard updates every few seconds (polling).
          </p>
        </div>

        {err && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {err}
          </p>
        )}

        <Card className="border-primary/25 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <GraduationCap className="size-5 text-primary" />
              Instructor · new session
            </CardTitle>
            <CardDescription>Creates a room code and live dashboard for this case.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case-pick">Case</Label>
              <select
                id="case-pick"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} · {c.category} (T{c.tier})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sess-title">Session title</Label>
              <Input id="sess-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <Button type="button" disabled={busy || !caseId} onClick={() => void createSession()}>
              {busy ? "Creating…" : "Create session & open dashboard"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Hash className="size-5 text-primary" />
              Student · join with code
            </CardTitle>
            <CardDescription>Enter the six-character code from your instructor.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="room-code">Room code</Label>
              <Input
                id="room-code"
                className="font-mono uppercase tracking-widest"
                placeholder="e.g. ABC12D"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
            <Button type="button" onClick={goJoin}>
              Continue
            </Button>
          </CardContent>
        </Card>

        <Card className="border-muted bg-muted/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4" />
              .edu verification
            </CardTitle>
            <CardDescription>
              Instructor roles can later require institutional email. For now any signed-in user may host a session.
            </CardDescription>
          </CardHeader>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/hall" className="text-primary underline-offset-4 hover:underline">
            View hall & leaderboards
          </Link>
        </p>
      </div>
    </JudicialShell>
  );
}
