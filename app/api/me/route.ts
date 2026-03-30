import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      careerPoints: true,
      currentTier: true,
      streakDays: true,
      lastPlayedAt: true,
    },
  });

  return NextResponse.json({ user });
}
