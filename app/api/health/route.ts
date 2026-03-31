import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Lightweight DB check for deployment debugging (open `/api/health` in the browser). */
export async function GET() {
  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (e) {
    console.error("[api/health]", e);
    const message = e instanceof Error ? e.message : "Database unreachable";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
