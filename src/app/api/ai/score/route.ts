import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { buildScoringPrompt, createScoringStream, truncateGraphForAI, truncateHistoryForAI } from "@/lib/ai"
import { LIMITS } from "@/lib/limits"
import type { LlmProvider } from "@/types"

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    )
  }

  const { sessionId, graph: rawGraph, history: rawHistory, llmProvider = "anthropic" } = await req.json()

  // Truncate inputs before they reach the AI (defense in depth)
  const graph = truncateGraphForAI(rawGraph)
  const history = truncateHistoryForAI(rawHistory ?? [])

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    )
  }

  // 2. Fetch from DB
  const interviewSession = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      scoresUsed: true,
      promptId: true,
    },
  })

  if (!interviewSession) {
    return NextResponse.json(
      { error: "session_not_found" },
      { status: 404 }
    )
  }

  // 3. Ownership
  if (interviewSession.userId !== session.user.id) {
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403 }
    )
  }

  // 4. Limit check from DB
  // Always read tier fresh from DB — token may be stale
  const userFromDb = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  })
  const userTier = userFromDb?.tier ?? "FREE"
  const limit = userTier === "FREE"
    ? LIMITS.free.scoresPerSession
    : Infinity

  if (interviewSession.scoresUsed >= limit) {
    return NextResponse.json(
      {
        error: "free_limit_reached",
        scoresUsed: interviewSession.scoresUsed,
      },
      { status: 403 }
    )
  }

  // 4b. Global Daily Limit check
  const { checkAndIncrementDailyScores } = await import("@/lib/daily-limits")
  const dailyCheck = await checkAndIncrementDailyScores(
    session.user.id,
    userTier as "FREE" | "PRO" | "PREMIUM"
  )

  if (!dailyCheck.allowed) {
    return NextResponse.json(
      {
        error: "daily_limit_reached",
        message: "Daily score limit reached. Resets in 24 hours.",
      },
      { status: 403 }
    )
  }

  // 5. Get active prompt
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

  // 6. Increment scoresUsed BEFORE streaming
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { scoresUsed: { increment: 1 } },
  })

  // 7. Build prompt + create stream
  const provider: LlmProvider = llmProvider;
  const scoringPrompt = buildScoringPrompt(activePrompt, graph, history)

  let stream: ReadableStream
  try {
    stream = await createScoringStream(scoringPrompt, provider)
  } catch (streamInitError: any) { // any: error shape varies between Anthropic and Gemini SDKs
    const status = streamInitError?.status ?? 500
    if (status === 429) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: "AI provider quota exceeded. Please wait a moment and try again.",
          retryAfter: 60,
        },
        { status: 429 }
      )
    }

    console.error(`[Score Error] Provider: ${provider}`, streamInitError);

    return NextResponse.json(
      { 
        error: "scoring_failed", 
        message: "Failed to start scoring. Check server logs.",
        debug: {
          provider,
          errorType: streamInitError?.constructor?.name,
          errorMessage: streamInitError?.message
        }
      },
      { status: 500 }
    )
  }

  // 8. Pipe stream to client
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Stream pipe + DB save in background
  ;(async () => {
    const reader = stream.getReader()
    let fullText = ""
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        fullText += chunk
        await writer.write(encoder.encode(chunk))
      }

      // Stream finished — save to DB
      try {
        const sanitized = fullText
          .trim()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim()

        if (sanitized.endsWith("}")) {
          const scoreResult = JSON.parse(sanitized)
          await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
              scoreResult,
              status: "SCORED",
            },
          })
        }
      } catch (parseErr) {
        // JSON parse failed — log but don't crash
        console.error("[score] Failed to save score to DB:", parseErr)
      }
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
