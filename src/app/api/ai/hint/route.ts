import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateAnthropicHint, generateGeminiHint } from "@/lib/ai"
import { LIMITS } from "@/lib/limits"
import type { LlmProvider } from "@/types"

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    )
  }

  const { sessionId, graph, history, llmProvider = "anthropic" } = await req.json()

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    )
  }

  // 2. Fetch session from DB — never trust client for limits
  const interviewSession = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, hintsUsed: true, promptId: true },
  })

  if (!interviewSession) {
    return NextResponse.json(
      { error: "session_not_found" },
      { status: 404 }
    )
  }

  // 3. Ownership check
  if (interviewSession.userId !== session.user.id) {
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403 }
    )
  }

  // 4. Limit check — from DB, not client
  const userTier = session.user.tier ?? "FREE"
  const limit = userTier === "FREE"
    ? LIMITS.free.aiHintsPerSession
    : Infinity

  if (interviewSession.hintsUsed >= limit) {
    return NextResponse.json(
      { error: "free_limit_reached" },
      { status: 403 }
    )
  }

  // 5. Get the active prompt from prompts.ts by promptId
  const { PROMPTS } = await import("@/lib/prompts")
  const activePrompt = PROMPTS.find(
    (p) => p.id === interviewSession.promptId
  )

  if (!activePrompt) {
    return NextResponse.json(
      { error: "prompt_not_found" },
      { status: 404 }
    )
  }

  // 6. Build prompt and call AI
  const provider: LlmProvider = llmProvider;
  let hint: string;
  let model: string;

  try {
    if (provider === "gemini") {
      hint = await generateGeminiHint(activePrompt, graph, history);
      model = "gemini";
    } else {
      hint = await generateAnthropicHint(activePrompt, graph, history);
      model = "haiku";
    }
  } catch (err: any) {
    console.error("Hint AI error:", err)
    return NextResponse.json(
      { error: "ai_failed", message: "Failed to generate hint." },
      { status: 500 }
    )
  }

  // 7. Increment hintsUsed in DB atomically
  const updated = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { hintsUsed: { increment: 1 } },
    select: { hintsUsed: true },
  })

  // 8. Return hint + new server-authoritative hintsUsed
  return NextResponse.json({
    hint,
    hintsUsed: updated.hintsUsed, // client syncs Zustand from this
    model,
  })
}