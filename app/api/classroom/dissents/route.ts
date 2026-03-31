import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!sessionId || text.length < 4) {
    return NextResponse.json({ error: "sessionId and text (min 4 chars) required" }, { status: 400 });
  }

  const participant = await prisma.sessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (!participant) {
    return NextResponse.json({ error: "Join the session first" }, { status: 403 });
  }

  const created = await prisma.dissent.create({
    data: { sessionId, userId, text },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
