import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userHasActiveSubscription } from "@/lib/subscription";

const cacheHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    let where: Prisma.CaseWhereInput;

    if (!userId) {
      where = { requiresSubscription: false, tier: 1 };
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          currentTier: true,
          subscriptionStatus: true,
          subscriptionValidUntil: true,
        },
      });
      const tier = user?.currentTier ?? 1;
      const subscribed = userHasActiveSubscription({
        subscriptionStatus: user?.subscriptionStatus ?? "NONE",
        subscriptionValidUntil: user?.subscriptionValidUntil ?? null,
      });
      where = {
        OR: [
          { requiresSubscription: false, tier: { lte: tier } },
          ...(subscribed ? [{ requiresSubscription: true }] : []),
        ],
      };
    }

    const cases = await prisma.case.findMany({
      where,
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
    return NextResponse.json({ cases }, { headers: cacheHeaders });
  } catch (e) {
    console.error("[api/cases]", e);
    return NextResponse.json({ error: "Could not load cases." }, { status: 500 });
  }
}
