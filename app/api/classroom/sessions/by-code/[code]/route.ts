import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const roomCode = code.trim().toUpperCase();
    if (roomCode.length < 4) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const row = await prisma.classSession.findUnique({
      where: { roomCode },
      select: {
        id: true,
        title: true,
        roomCode: true,
        caseId: true,
        case: { select: { title: true, tier: true, category: true } },
      },
    });

    if (!row) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    return NextResponse.json({
      session: {
        id: row.id,
        title: row.title,
        roomCode: row.roomCode,
        caseId: row.caseId,
        caseTitle: row.case.title,
        caseTier: row.case.tier,
        caseCategory: row.case.category,
      },
    });
  } catch (e) {
    console.error("[api/classroom/by-code]", e);
    return NextResponse.json({ error: "Could not load session." }, { status: 500 });
  }
}
