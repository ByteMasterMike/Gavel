import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await ctx.params;

  const sess = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      case: { select: { title: true } },
      participants: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!sess) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (sess.instructorId !== userId) {
    return NextResponse.json({ error: "Instructor only" }, { status: 403 });
  }

  const rulings = await prisma.userRuling.findMany({
    where: { sessionId },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      userId: true,
      verdict: true,
      totalScore: true,
      status: true,
      submittedAt: true,
      citedPrecedentIds: true,
      flaggedDocIds: true,
    },
  });

  const verdictCounts: Record<string, number> = {};
  let flagTotal = 0;
  const precedentCounts = new Map<string, number>();

  for (const r of rulings) {
    if (r.status === "SCORED") {
      verdictCounts[r.verdict] = (verdictCounts[r.verdict] ?? 0) + 1;
    }
    flagTotal += r.flaggedDocIds.length;
    for (const pid of r.citedPrecedentIds) {
      precedentCounts.set(pid, (precedentCounts.get(pid) ?? 0) + 1);
    }
  }

  const participantByUser = new Map(sess.participants.map((p) => [p.userId, p]));

  const rulingRows = rulings.map((r) => {
    const p = participantByUser.get(r.userId);
    const anon = p?.isAnonymous;
    const label =
      anon && p?.anonymousDisplayName
        ? p.anonymousDisplayName
        : p?.user?.name?.trim() || "Player";
    return {
      id: r.id,
      userId: r.userId,
      displayLabel: label,
      isAnonymous: Boolean(anon),
      verdict: r.verdict,
      totalScore: r.totalScore,
      status: r.status,
      submittedAt: r.submittedAt.toISOString(),
      citedCount: r.citedPrecedentIds.length,
      flagsCount: r.flaggedDocIds.length,
    };
  });

  const precedentLabels = await prisma.precedent.findMany({
    where: { caseId: sess.caseId },
    select: { id: true, name: true, citation: true },
  });
  const precMap = new Map(precedentLabels.map((p) => [p.id, p]));

  const citedHistogram = [...precedentCounts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      label: precMap.get(id)?.citation ?? precMap.get(id)?.name ?? id,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const dissents = await prisma.dissent.findMany({
    where: { sessionId },
    orderBy: { id: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    session: {
      id: sess.id,
      title: sess.title,
      roomCode: sess.roomCode,
      caseTitle: sess.case.title,
    },
    verdictCounts,
    flagTotal,
    citedHistogram,
    participants: sess.participants.map((p) => ({
      userId: p.userId,
      isAnonymous: p.isAnonymous,
      displayName: p.isAnonymous
        ? p.anonymousDisplayName ?? "Anonymous"
        : p.user.name?.trim() || "Player",
      joinedAt: p.joinedAt.toISOString(),
    })),
    rulings: rulingRows,
    dissents: dissents.map((d) => ({
      id: d.id,
      userId: d.userId,
      author: d.user.name?.trim() || "Player",
      text: d.text,
      status: d.status,
      instructorComment: d.instructorComment,
    })),
  });
}
