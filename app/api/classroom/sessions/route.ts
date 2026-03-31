import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/classroomCode";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const caseId = typeof b.caseId === "string" ? b.caseId : null;
  const title = typeof b.title === "string" && b.title.trim() ? b.title.trim() : "Class session";
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });

  const caseRow = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } });
  if (!caseRow) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  for (let attempt = 0; attempt < 8; attempt++) {
    const roomCode = generateRoomCode(6);
    const existing = await prisma.classSession.findUnique({ where: { roomCode }, select: { id: true } });
    if (existing) continue;
    try {
      const created = await prisma.classSession.create({
        data: {
          instructorId: userId,
          title,
          roomCode,
          caseId,
        },
        select: { id: true, roomCode: true, title: true, caseId: true },
      });
      return NextResponse.json(created);
    } catch {
      /* collision */
    }
  }
  return NextResponse.json({ error: "Could not allocate room code." }, { status: 500 });
}
