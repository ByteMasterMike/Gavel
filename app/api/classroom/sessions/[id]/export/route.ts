import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await ctx.params;

  const sess = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!sess) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (sess.instructorId !== userId) {
    return NextResponse.json({ error: "Instructor only" }, { status: 403 });
  }

  const rulings = await prisma.userRuling.findMany({
    where: { sessionId },
    orderBy: { submittedAt: "asc" },
    select: {
      userId: true,
      verdict: true,
      totalScore: true,
      status: true,
      submittedAt: true,
    },
  });

  const partMap = new Map(
    sess.participants.map((p) => [
      p.userId,
      p.isAnonymous ? p.anonymousDisplayName ?? "Anonymous" : p.user.name?.trim() || "Player",
    ]),
  );

  const header = ["displayName", "userId", "verdict", "totalScore", "status", "submittedAt"];
  const lines = [
    header.join(","),
    ...rulings.map((r) =>
      [
        csvEscape(partMap.get(r.userId) ?? r.userId),
        csvEscape(r.userId),
        csvEscape(r.verdict),
        r.totalScore ?? "",
        csvEscape(r.status),
        csvEscape(r.submittedAt.toISOString()),
      ].join(","),
    ),
  ];

  const body = lines.join("\r\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="session-${sess.roomCode}-rulings.csv"`,
    },
  });
}
