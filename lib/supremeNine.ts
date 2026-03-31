import { prisma } from "@/lib/prisma";

/** Recompute ceremonial seats from top Tier 5 career points (distinct users, max 9). */
export async function syncSupremeNineSeats(): Promise<void> {
  const top = await prisma.user.findMany({
    where: { currentTier: 5 },
    orderBy: { careerPoints: "desc" },
    take: 9,
    select: { id: true, careerPoints: true },
  });

  await prisma.$transaction(
    Array.from({ length: 9 }, (_, i) => {
      const u = top[i];
      return prisma.supremeNineSeat.upsert({
        where: { slot: i + 1 },
        create: {
          slot: i + 1,
          userId: u?.id ?? null,
          careerPointsSnapshot: u?.careerPoints ?? 0,
        },
        update: {
          userId: u?.id ?? null,
          careerPointsSnapshot: u?.careerPoints ?? 0,
        },
      });
    }),
  );
}
