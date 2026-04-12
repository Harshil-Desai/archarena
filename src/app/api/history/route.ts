import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Read tier from DB (not session token — may be stale)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  })

  if (user?.tier === "FREE") {
    return NextResponse.json({ error: "pro_required" }, { status: 403 })
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      promptId: true,
      hintsUsed: true,
      scoresUsed: true,
      scoreResult: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ sessions })
}
