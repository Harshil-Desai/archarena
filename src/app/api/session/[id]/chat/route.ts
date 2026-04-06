import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
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

  const { chatHistory } = await req.json()

  if (!Array.isArray(chatHistory)) {
    return NextResponse.json(
      { error: "chatHistory must be an array" },
      { status: 400 }
    )
  }

  const resolvedParams = await params;

  const existing = await prisma.interviewSession.findUnique({
    where: { id: resolvedParams.id },
    select: { userId: true },
  })

  if (!existing) {
    return NextResponse.json(
      { error: "session_not_found" },
      { status: 404 }
    )
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403 }
    )
  }

  await prisma.interviewSession.update({
    where: { id: resolvedParams.id },
    data: { chatHistory },
  })

  return NextResponse.json({ ok: true })
}
