import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cases = await prisma.case.findMany({
    orderBy: [{ tier: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      tier: true,
      kind: true,
      category: true,
      parTimeMinutes: true,
    },
  });
  return NextResponse.json({ cases });
}
