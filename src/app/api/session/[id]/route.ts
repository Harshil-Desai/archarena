import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    )
  }

  const resolvedParams = await params;

  const interviewSession = await prisma.interviewSession.findUnique({
    where: { id: resolvedParams.id },
  })

  if (!interviewSession) {
    return NextResponse.json(
      { error: "session_not_found" },
      { status: 404 }
    )
  }

  // Users can only read their own sessions
  if (interviewSession.userId !== session.user.id) {
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403 }
    )
  }

  return NextResponse.json({
    sessionId: interviewSession.id,
    promptId: interviewSession.promptId,
    hintsUsed: interviewSession.hintsUsed,
    scoresUsed: interviewSession.scoresUsed,
    canvasState: interviewSession.canvasState,
    chatHistory: interviewSession.chatHistory,
    scoreResult: interviewSession.scoreResult,
    status: interviewSession.status,
    createdAt: interviewSession.createdAt,
    updatedAt: interviewSession.updatedAt,
  })
}
