import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    )
  }

  const { promptId } = await req.json()

  if (!promptId || typeof promptId !== "string") {
    return NextResponse.json(
      { error: "promptId is required" },
      { status: 400 }
    )
  }

  const interviewSession = await prisma.interviewSession.upsert({
    where: {
      userId_promptId: {
        userId: session.user.id,
        promptId,
      },
    },
    update: {
      // Session exists — just bump lastActiveAt
      // Do NOT reset hintsUsed, canvasState, or chatHistory
      lastActiveAt: new Date(),
    },
    create: {
      userId: session.user.id,
      promptId,
      hintsUsed: 0,
      scoresUsed: 0,
      status: "ACTIVE",
    },
  })

  return NextResponse.json({
    sessionId: interviewSession.id,
    promptId: interviewSession.promptId,
    hintsUsed: interviewSession.hintsUsed,
    scoresUsed: interviewSession.scoresUsed,
    canvasState: interviewSession.canvasState,
    chatHistory: interviewSession.chatHistory,
    scoreResult: interviewSession.scoreResult,
    status: interviewSession.status,
  })
}
