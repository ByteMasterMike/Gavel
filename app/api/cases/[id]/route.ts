import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toPublicCase } from "@/lib/casePublic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = await prisma.case.findUnique({
    where: { id },
    include: { documents: true, precedents: true },
  });
  if (!row) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ case: toPublicCase(row) });
}

/** Returns precedent IDs visible after consuming a hint level (does not expose isRelevant in case JSON). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  let level = 1;
  try {
    const body = await req.json();
    if (body?.level === 2) level = 2;
  } catch {
    /* default level 1 */
  }

  const row = await prisma.case.findUnique({
    where: { id },
    include: { precedents: true },
  });
  if (!row) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const rel = row.precedents.filter((p) => p.isRelevant).map((p) => p.id);
  const decoys = row.precedents.filter((p) => !p.isRelevant).sort((a, b) => a.sortOrder - b.sortOrder);

  if (level === 2) {
    return NextResponse.json({ visibleIds: rel });
  }

  const decoy = decoys[0];
  const visible = decoy ? [...rel, decoy.id] : rel;
  return NextResponse.json({ visibleIds: visible });
}
