import { NextRequest } from "next/server";
import { streamAnthropicScore, streamGeminiScore } from "@/lib/ai";
import { LIMITS } from "@/lib/limits";
import type { LlmProvider } from "@/types";

export async function POST(req: NextRequest) {
  const { prompt, graph, notes, history, scoresUsed, llmProvider = "anthropic" } = await req.json();

  if (scoresUsed >= LIMITS.free.scoresPerSession) {
    return new Response(
      JSON.stringify({ error: "free_limit_reached" }),
      { status: 403 }
    );
  }

  const provider: LlmProvider = llmProvider;
  let stream: ReadableStream<Uint8Array>;

  if (provider === "gemini") {
    stream = streamGeminiScore(prompt, graph, notes, history);
  } else {
    stream = streamAnthropicScore(prompt, graph, notes, history);
  }

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}