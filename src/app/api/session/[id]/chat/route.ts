import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  generateAnthropicChatReply,
  generateGeminiChatReply,
  truncateGraphForAI,
  truncateHistoryForAI,
} from "@/lib/ai"
import type { AIModel, ChatMessage, LlmProvider, SemanticGraph } from "@/types"

export async function POST(
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

  const {
    message,
    graph,
    llmProvider = "anthropic",
  }: {
    message?: string
    graph?: SemanticGraph
    llmProvider?: LlmProvider
  } = await req.json()

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    )
  }

  if (!graph || typeof graph !== "object") {
    return NextResponse.json(
      { error: "graph is required" },
      { status: 400 }
    )
  }

  const resolvedParams = await params

  const interviewSession = await prisma.interviewSession.findUnique({
    where: { id: resolvedParams.id },
    select: {
      userId: true,
      promptId: true,
      chatHistory: true,
    },
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

  const { PROMPTS } = await import("@/lib/prompts")
  const activePrompt = PROMPTS.find((prompt) => prompt.id === interviewSession.promptId)

  if (!activePrompt) {
    return NextResponse.json(
      { error: "prompt_not_found" },
      { status: 404 }
    )
  }

  const persistedHistory = Array.isArray(interviewSession.chatHistory)
    ? interviewSession.chatHistory as unknown as ChatMessage[]
    : []

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: message.trim(),
    timestamp: Date.now(),
  }

  const historyWithUserMessage = [...persistedHistory, userMessage]

  // Truncate inputs before they reach the AI (defense in depth)
  const safeGraph = truncateGraphForAI(graph)
  const safeHistory = truncateHistoryForAI(historyWithUserMessage)

  let reply: string
  let model: AIModel

  try {
    if (llmProvider === "gemini") {
      reply = await generateGeminiChatReply(activePrompt, safeGraph, safeHistory)
      model = "flash"
    } else {
      reply = await generateAnthropicChatReply(activePrompt, safeGraph, safeHistory)
      model = "haiku"
    }
  } catch (err) {
    console.error("Chat AI error:", err)
    return NextResponse.json(
      { error: "ai_failed", message: "Failed to generate a reply." },
      { status: 500 }
    )
  }

  const assistantMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "ai",
    content: reply.trim(),
    timestamp: Date.now(),
    model,
  }

  const chatHistory = [...historyWithUserMessage, assistantMessage]

  await prisma.interviewSession.update({
    where: { id: resolvedParams.id },
    data: {
      chatHistory: chatHistory as unknown as Prisma.InputJsonValue,
      lastActiveAt: new Date(),
    },
  })

  return NextResponse.json({
    reply: assistantMessage.content,
    model,
    chatHistory,
  })
}

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
