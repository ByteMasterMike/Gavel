import { NextResponse } from "next/server";
import { safeParseCaseImportJson } from "@/lib/caseImport/schema";
import { caseImportToPrismaCreate } from "@/lib/caseImport/toPrisma";
import { prisma } from "@/lib/prisma";

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const secret = process.env.ADMIN_IMPORT_SECRET?.trim();
  if (!secret) {
    console.error("[admin/cases/import] ADMIN_IMPORT_SECRET is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token || token !== secret) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = safeParseCaseImportJson(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.case.create({
      data: caseImportToPrismaCreate(parsed.data),
    });
    return NextResponse.json({
      ok: true,
      caseId: created.id,
      title: created.title,
    });
  } catch (e) {
    console.error("[admin/cases/import]", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
