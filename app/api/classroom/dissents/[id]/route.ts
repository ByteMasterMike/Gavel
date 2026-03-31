import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: dissentId } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status === "APPROVED" || body.status === "DECLINED" ? body.status : null;
  const instructorComment =
    typeof body.instructorComment === "string" ? body.instructorComment.trim().slice(0, 2000) : null;

  if (!status) {
    return NextResponse.json({ error: "status APPROVED or DECLINED required" }, { status: 400 });
  }

  const row = await prisma.dissent.findUnique({
    where: { id: dissentId },
    include: { session: { select: { instructorId: true, id: true } } },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.session.instructorId !== userId) {
    return NextResponse.json({ error: "Instructor only" }, { status: 403 });
  }

  await prisma.dissent.update({
    where: { id: dissentId },
    data: {
      status,
      instructorComment: instructorComment ?? undefined,
    },
  });

  if (status === "APPROVED") {
    const existing = await prisma.classroomBadgeGrant.findFirst({
      where: {
        userId: row.userId,
        sessionId: row.sessionId,
        kind: "DISTINGUISHED_DISSENTER",
      },
    });
    if (!existing) {
      await prisma.classroomBadgeGrant.create({
        data: {
          userId: row.userId,
          sessionId: row.sessionId,
          kind: "DISTINGUISHED_DISSENTER",
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
