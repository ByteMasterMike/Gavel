"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { JudicialShell } from "@/components/shell/JudicialShell";
import { AppSidebarHome } from "@/components/shell/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type SessionInfo = {
  id: string;
  title: string;
  roomCode: string;
  caseId: string;
  caseTitle: string;
  caseTier: number;
  caseCategory: string;
};

export default function ClassroomJoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).trim().toUpperCase();
  const { data: session, status } = useSession();
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [anon, setAnon] = useState(false);
  const [anonName, setAnonName] = useState("");
  const [dissent, setDissent] = useState("");
  const [dissentOk, setDissentOk] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    void (async () => {
      setLoadErr(null);
      const res = await fetch(`/api/classroom/sessions/by-code/${encodeURIComponent(code)}`);
      if (c) return;
      if (!res.ok) {
        setLoadErr("Session not found.");
        setInfo(null);
        return;
      }
      const j = (await res.json()) as { session: SessionInfo };
      setInfo(j.session);
    })();
    return () => {
      c = true;
    };
  }, [code]);

  const join = useCallback(async () => {
    if (!info || !session?.user) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/classroom/sessions/${info.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAnonymous: anon,
          anonymousDisplayName: anon ? anonName || "Anonymous" : null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setLoadErr(j.error ?? "Could not join");
        return;
      }
      setJoined(true);
    } finally {
      setBusy(false);
    }
  }, [anon, anonName, info, session?.user]);

  const submitDissent = useCallback(async () => {
    if (!info || dissent.trim().length < 4) return;
    setBusy(true);
    try {
      const res = await fetch("/api/classroom/dissents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: info.id, text: dissent.trim() }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoadErr(j.error ?? "Could not submit dissent");
        return;
      }
      setDissentOk("Dissent submitted for instructor review.");
      setDissent("");
    } finally {
      setBusy(false);
    }
  }, [dissent, info]);

  const handleSignInDev = useCallback(() => {
    void signIn("dev", { callbackUrl: `/classroom/session/${code}` });
  }, [code]);

  const handleSignInGoogle = useCallback(() => {
    void signIn("google", { callbackUrl: `/classroom/session/${code}` });
  }, [code]);

  const handleBackToClassroom = useCallback(() => {
    router.push("/classroom");
  }, [router]);

  if (status === "loading") {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
        <p className="p-8 text-center text-muted-foreground" role="status">
          Loading…
        </p>
      </JudicialShell>
    );
  }

  if (!session?.user) {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
        <div className="mx-auto max-w-md p-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Sign in to join</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {process.env.NODE_ENV === "development" && (
                <Button type="button" onClick={handleSignInDev}>
                  Dev sign-in
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={handleSignInGoogle}>
                Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </JudicialShell>
    );
  }

  if (loadErr && !info) {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
        <div className="mx-auto max-w-md space-y-4 p-8">
          <p className="text-destructive">{loadErr}</p>
          <Button type="button" variant="outline" onClick={handleBackToClassroom}>
            Back
          </Button>
        </div>
      </JudicialShell>
    );
  }

  if (!info) {
    return (
      <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
        <p className="p-8 text-center text-muted-foreground">Loading session…</p>
      </JudicialShell>
    );
  }

  const playHref = `/case/${info.caseId}?session=${encodeURIComponent(info.id)}`;

  return (
    <JudicialShell sidebar={<AppSidebarHome active="classroom" />}>
      <main className="mx-auto max-w-lg space-y-6 px-4 py-8" aria-labelledby="session-room-title">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary">Room {info.roomCode}</p>
          <h1 id="session-room-title" className="mt-1 font-heading text-2xl font-semibold">
            {info.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Case: <span className="text-foreground">{info.caseTitle}</span> · {info.caseCategory} · Tier{" "}
            {info.caseTier}
          </p>
        </div>

        {loadErr && <p className="text-sm text-destructive">{loadErr}</p>}

        {!joined ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Join this session</CardTitle>
              <CardDescription>Your rulings will be linked to this room for the instructor dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={anon}
                  onChange={(e) => setAnon(e.target.checked)}
                />
                <span>Appear anonymously on the dashboard</span>
              </label>
              {anon && (
                <div className="space-y-2">
                  <Label htmlFor="anon-name">Display label</Label>
                  <Input
                    id="anon-name"
                    placeholder="e.g. Student A"
                    value={anonName}
                    onChange={(e) => setAnonName(e.target.value)}
                  />
                </div>
              )}
              <Button type="button" disabled={busy} onClick={() => void join()}>
                {busy ? "Joining…" : "Join session"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">You&apos;re in</CardTitle>
              <CardDescription>Open the case using the link below so access and scoring stay in-session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={playHref} className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center")}>
                Open case file
              </Link>
              <p className="text-xs text-muted-foreground">
                After your ruling is scored, you may submit a short dissent for the instructor to review.
              </p>
            </CardContent>
          </Card>
        )}

        {joined && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post-ruling dissent (optional)</CardTitle>
              <CardDescription>Share a counter-argument or reflection. Your instructor can approve or decline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Your dissent…"
                value={dissent}
                onChange={(e) => setDissent(e.target.value)}
              />
              <Button type="button" variant="outline" disabled={busy || dissent.trim().length < 4} onClick={() => void submitDissent()}>
                Submit dissent
              </Button>
              {dissentOk && <p className="text-sm text-primary">{dissentOk}</p>}
            </CardContent>
          </Card>
        )}

        <Button type="button" variant="ghost" onClick={handleBackToClassroom}>
          Classroom home
        </Button>
      </main>
    </JudicialShell>
  );
}
