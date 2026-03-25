import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildHintPrompt, MODEL_MAP } from "@/lib/ai";
import { LIMITS } from "@/lib/limits";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { prompt, graph, notes, hintsUsed } = await req.json();

  if (hintsUsed >= LIMITS.free.aiHintsPerSession) {
    return NextResponse.json({ error: "free_limit_reached" }, { status: 403 });
  }

  const message = await client.messages.create({
    model: MODEL_MAP.haiku,
    max_tokens: 150,
    messages: [{ role: "user", content: buildHintPrompt(prompt, graph, notes) }],
  });

  const hint = (message.content[0] as any).text;
  return NextResponse.json({ hint });
}