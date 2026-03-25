import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildScoringPrompt, MODEL_MAP } from "@/lib/ai";
import { LIMITS } from "@/lib/limits";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { prompt, graph, notes, history, scoresUsed } = await req.json();

  if (scoresUsed >= LIMITS.free.scoresPerSession) {
    return new Response(
      JSON.stringify({ error: "free_limit_reached" }),
      { status: 403 }
    );
  }

  const stream = await client.messages.stream({
    model: MODEL_MAP.sonnet,
    max_tokens: 800,
    messages: [{
      role: "user",
      content: buildScoringPrompt(prompt, graph, notes, history),
    }],
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}