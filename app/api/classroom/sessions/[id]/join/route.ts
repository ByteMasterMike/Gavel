import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await ctx.params;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* optional body */
  }
  const isAnonymous = Boolean(body.isAnonymous);
  const anonymousDisplayName =
    typeof body.anonymousDisplayName === "string" ? body.anonymousDisplayName.trim().slice(0, 48) : null;

  const sess = await prisma.classSession.findUnique({ where: { id: sessionId }, select: { id: true } });
  if (!sess) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  await prisma.sessionParticipant.upsert({
    where: { sessionId_userId: { sessionId, userId } },
    create: {
      sessionId,
      userId,
      isAnonymous,
      anonymousDisplayName: isAnonymous ? anonymousDisplayName || "Anonymous" : null,
    },
    update: {
      isAnonymous,
      anonymousDisplayName: isAnonymous ? anonymousDisplayName || "Anonymous" : null,
    },
  });

  return NextResponse.json({ ok: true });
}
