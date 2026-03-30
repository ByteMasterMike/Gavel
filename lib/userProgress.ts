import { prisma } from "@/lib/prisma";

function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Update streak and career points after a scored ruling.
 */
export async function applyRulingRewards(userId: string, finalScore: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = utcDay(new Date());
  const last = user.lastPlayedAt ? utcDay(user.lastPlayedAt) : null;

  let streak = user.streakDays;
  if (!last) streak = 1;
  else if (last === today) {
    /* same day — keep streak */
  } else {
    const lastDate = new Date(last + "T12:00:00.000Z");
    const todayDate = new Date(today + "T12:00:00.000Z");
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
    if (diffDays === 1) streak += 1;
    else streak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      careerPoints: user.careerPoints + finalScore,
      streakDays: streak,
      lastPlayedAt: new Date(),
    },
  });
}
