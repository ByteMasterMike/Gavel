import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toPublicCase } from "@/lib/casePublic";
import { isExpiredPastDailyCase } from "@/lib/dailyPolicy";
import { evaluateCaseAccess, getTodaysDailyCaseId, getUserSubscriptionFields } from "@/lib/caseAccess";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const session = await auth();
    const sessionUserId = session?.user?.id ?? null;
    const sessionIdParam = new URL(req.url).searchParams.get("sessionId");

    const row = await prisma.case.findUnique({
      where: { id },
      include: { documents: true, precedents: true },
    });
    if (!row) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    if (await isExpiredPastDailyCase(row.id)) {
      return NextResponse.json(
        { error: "This Morning Docket case is no longer available." },
        { status: 403 },
      );
    }

    const [todaysDailyCaseId, userTier, subscription, classroomOk] = await Promise.all([
      getTodaysDailyCaseId(),
      sessionUserId
        ? prisma.user
            .findUnique({ where: { id: sessionUserId }, select: { currentTier: true } })
            .then((u) => u?.currentTier ?? 1)
        : Promise.resolve(1),
      sessionUserId ? getUserSubscriptionFields(sessionUserId) : Promise.resolve({ subscriptionStatus: "NONE" as const, subscriptionValidUntil: null }),
      sessionUserId && sessionIdParam
        ? prisma.classSession.findFirst({
            where: {
              id: sessionIdParam,
              caseId: row.id,
              participants: { some: { userId: sessionUserId } },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const access = evaluateCaseAccess({
      sessionUserId,
      userTier,
      subscription,
      caseRow: { id: row.id, tier: row.tier, requiresSubscription: row.requiresSubscription },
      todaysDailyCaseId,
      classroomSessionCaseId: classroomOk ? row.id : null,
    });

    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    return NextResponse.json({ case: toPublicCase(row) });
  } catch (e) {
    console.error("[api/cases/[id] GET]", e);
    return NextResponse.json({ error: "Could not load case." }, { status: 500 });
  }
}

/** Returns precedent IDs visible after consuming a hint level (does not expose isRelevant in case JSON). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    let level = 1;
    let sessionIdBody: string | null = null;
    try {
      const body = (await req.json()) as { level?: unknown; sessionId?: unknown };
      if (body?.level === 2) level = 2;
      if (typeof body?.sessionId === "string" && body.sessionId.length > 0) {
        sessionIdBody = body.sessionId;
      }
    } catch {
      /* default level 1 */
    }

    const row = await prisma.case.findUnique({
      where: { id },
      include: { precedents: true },
    });
    if (!row) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    if (await isExpiredPastDailyCase(row.id)) {
      return NextResponse.json(
        { error: "This Morning Docket case is no longer available." },
        { status: 403 },
      );
    }

    const [todaysDailyCaseId, userTier, subscription, classroomOk] = await Promise.all([
      getTodaysDailyCaseId(),
      prisma.user.findUnique({ where: { id: userId }, select: { currentTier: true } }).then((u) => u?.currentTier ?? 1),
      getUserSubscriptionFields(userId),
      sessionIdBody
        ? prisma.classSession.findFirst({
            where: {
              id: sessionIdBody,
              caseId: row.id,
              participants: { some: { userId } },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);
    const access = evaluateCaseAccess({
      sessionUserId: userId,
      userTier,
      subscription,
      caseRow: { id: row.id, tier: row.tier, requiresSubscription: row.requiresSubscription },
      todaysDailyCaseId,
      classroomSessionCaseId: classroomOk ? row.id : null,
    });
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const rel = row.precedents.filter((p) => p.isRelevant).map((p) => p.id);
    const decoys = row.precedents
      .filter((p) => !p.isRelevant)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (level === 2) {
      return NextResponse.json({ visibleIds: rel });
    }

    const decoy = decoys[0];
    const visible = decoy ? [...rel, decoy.id] : rel;
    return NextResponse.json({ visibleIds: visible });
  } catch (e) {
    console.error("[api/cases/[id] POST]", e);
    return NextResponse.json({ error: "Could not load hints." }, { status: 500 });
  }
}
