import { NextRequest, NextResponse } from "next/server";
import { buildScoringPrompt, createScoringStream } from "@/lib/ai";
import { LIMITS } from "@/lib/limits";
import type { LlmProvider } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { prompt, graph, history, scoresUsed, llmProvider = "anthropic" } = await req.json();

    if (scoresUsed >= LIMITS.free.scoresPerSession) {
      return NextResponse.json(
        { error: "free_limit_reached" },
        { status: 403 }
      );
    }

    const provider: LlmProvider = llmProvider;
    const scoringPrompt = buildScoringPrompt(prompt, graph, history);

    let stream: ReadableStream;

    try {
      stream = await createScoringStream(scoringPrompt, provider);
    } catch (streamInitError: any) {
      const status = streamInitError?.status ?? 500;

      if (status === 429) {
        return NextResponse.json(
          {
            error: "quota_exceeded",
            message: "AI provider quota exceeded. Please wait a moment and try again.",
            retryAfter: 60,
          },
          { status: 429 }
        );
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
      );
    }

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (outerError) {
    console.error("Score route outer error:", outerError);
    return NextResponse.json(
      { error: "unexpected_error" },
      { status: 500 }
    );
  }
}
