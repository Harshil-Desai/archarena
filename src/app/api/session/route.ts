import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

function serializeSession(session: {
  id: string
  promptId: string
  hintsUsed: number
  scoresUsed: number
  canvasState: unknown
  chatHistory: unknown
  scoreResult: unknown
  status: string
  createdAt: Date
  updatedAt: Date
  lastActiveAt: Date
}) {
  return {
    sessionId: session.id,
    promptId: session.promptId,
    hintsUsed: session.hintsUsed,
    scoresUsed: session.scoresUsed,
    canvasState: session.canvasState,
    chatHistory: session.chatHistory,
    scoreResult: session.scoreResult,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastActiveAt: session.lastActiveAt,
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    )
  }

  const promptId = new URL(req.url).searchParams.get("promptId")

  if (promptId) {
    const interviewSession = await prisma.interviewSession.findUnique({
      where: {
        userId_promptId: {
          userId: session.user.id,
          promptId,
        },
      },
    })

    if (!interviewSession) {
      return NextResponse.json(
        { error: "session_not_found" },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeSession(interviewSession))
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    orderBy: { lastActiveAt: "desc" },
  })

  return NextResponse.json({
    sessions: sessions.map(serializeSession),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    )
  }

  const {
    promptId,
    sessionId,
  }: {
    promptId?: string
    sessionId?: string
  } = await req.json()

  if (sessionId) {
    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    })

    if (!interviewSession) {
      return NextResponse.json(
        { error: "session_not_found" },
        { status: 404 }
      )
    }

    if (interviewSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: "forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json(serializeSession(interviewSession))
  }

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

  return NextResponse.json(serializeSession(interviewSession))
}
