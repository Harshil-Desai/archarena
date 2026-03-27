import { NextRequest, NextResponse } from "next/server";
import { generateAnthropicHint, generateGeminiHint } from "@/lib/ai";
import { LIMITS } from "@/lib/limits";
import type { LlmProvider } from "@/types";

export async function POST(req: NextRequest) {
  const { prompt, graph, notes, hintsUsed, llmProvider = "anthropic" } = await req.json();

  if (hintsUsed >= LIMITS.free.aiHintsPerSession) {
    return NextResponse.json({ error: "free_limit_reached" }, { status: 403 });
  }

  const provider: LlmProvider = llmProvider;
  let hint: string;

  if (provider === "gemini") {
    hint = await generateGeminiHint(prompt, graph, notes);
  } else {
    hint = await generateAnthropicHint(prompt, graph, notes);
  }

  return NextResponse.json({ hint });
}