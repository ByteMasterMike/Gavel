import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncSupremeNineSeats } from "@/lib/supremeNine";

export async function GET() {
  try {
    await syncSupremeNineSeats();

    const seats = await prisma.supremeNineSeat.findMany({
      orderBy: { slot: "asc" },
      include: {
        user: {
          select: { id: true, name: true, image: true, careerPoints: true, currentTier: true },
        },
      },
    });

    const payload = seats.map((s) => ({
      slot: s.slot,
      careerPointsSnapshot: s.careerPointsSnapshot,
      user: s.user
        ? {
            id: s.user.id,
            displayName: s.user.name?.trim() || "Seat open",
            image: s.user.image,
            careerPoints: s.user.careerPoints,
            currentTier: s.user.currentTier,
          }
        : null,
    }));

    return NextResponse.json({ seats: payload });
  } catch (e) {
    console.error("[api/leaderboard/supreme-nine]", e);
    return NextResponse.json({ error: "Could not load Supreme 9." }, { status: 500 });
  }
}
