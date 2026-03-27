import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DesignPrompt } from "./prompts";
import { ChatMessage, SemanticGraph, AIModel } from "@/types";

const anthropicClient = new Anthropic();

// Lazy-init Gemini client (only when env var is set)
let _geminiClient: GoogleGenerativeAI | null = null;
function getGeminiClient(): GoogleGenerativeAI {
  if (!_geminiClient) {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not set");
    }
    _geminiClient = new GoogleGenerativeAI(key);
  }
  return _geminiClient;
}

// ── Anthropic model routing ────────────────────────────────────────
export const MODEL_MAP: Record<AIModel, string> = {
  haiku: "claude-haiku-4-5-20251001",    // background hints, chat
  sonnet: "claude-sonnet-4-6",           // final scoring
};

// ── Gemini model routing ───────────────────────────────────────────
// export const GEMINI_MODEL_MAP = {
//   flash: "gemini-1.5-flash",   // background hints, chat
//   pro: "gemini-1.5-pro",       // final scoring
// } as const;

export const GEMINI_MODEL_MAP = {
  flash: "gemini-2.5-flash",   // background hints, chat
  pro: "gemini-2.5-pro",       // final scoring
} as const;

// ── Prompt builders (model-agnostic) ───────────────────────────────

// PROMPT 1 — background hint (fast model)
export function buildHintPrompt(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  notes: string
): string {
  return `You are a system design interviewer watching a candidate work live.

Question: "${prompt.title}" — ${prompt.description}

Current architecture graph:
Nodes: ${JSON.stringify(graph.nodes, null, 2)}
Connections: ${JSON.stringify(graph.edges, null, 2)}
${graph.unlabeledEdgeCount > 0 ? `Warning: ${graph.unlabeledEdgeCount} connections are unlabeled.` : ""}

Candidate notes: ${notes || "None yet."}

Give ONE short, specific hint about something missing or worth considering.
Max 2 sentences. Don't reveal the full answer. Don't be sycophantic.
If the canvas is empty, tell them to start by clarifying scale requirements.`;
}

// PROMPT 2 — final score (strong model)
export function buildScoringPrompt(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  notes: string,
  history: ChatMessage[]
): string {
  return `You are a senior staff engineer scoring a system design interview.

Question: "${prompt.title}" — ${prompt.description}

Scoring criteria:
${prompt.scoringCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Final architecture submitted:
Nodes: ${JSON.stringify(graph.nodes, null, 2)}
Connections: ${JSON.stringify(graph.edges, null, 2)}

Candidate notes: ${notes || "None."}

Score the design out of 100. No design is perfect — 100 is unachievable.
Respond ONLY as valid JSON in this exact shape:
{
  "score": <number 0-99>,
  "breakdown": {
    "scalability": <0-25>,
    "reliability": <0-25>,
    "tradeoffs": <0-25>,
    "completeness": <0-25>
  },
  "feedback": "<2-3 sentence overall summary>",
  "missedConcepts": ["<concept>", ...]
}`;
}

// ── Anthropic implementations ──────────────────────────────────────

export async function generateAnthropicHint(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  notes: string
): Promise<string> {
  const message = await anthropicClient.messages.create({
    model: MODEL_MAP.haiku,
    max_tokens: 150,
    messages: [{ role: "user", content: buildHintPrompt(prompt, graph, notes) }],
  });

  // safe cast — Anthropic always returns text for non-tool messages
  const hint = (message.content[0] as { type: "text"; text: string }).text;
  return hint;
}

export function streamAnthropicScore(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  notes: string,
  history: ChatMessage[]
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const stream = await anthropicClient.messages.stream({
        model: MODEL_MAP.sonnet,
        max_tokens: 800,
        messages: [{
          role: "user",
          content: buildScoringPrompt(prompt, graph, notes, history),
        }],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });
}

// ── Gemini implementations ─────────────────────────────────────────

export async function generateGeminiHint(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  notes: string
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: GEMINI_MODEL_MAP.flash });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildHintPrompt(prompt, graph, notes) }] }],
    generationConfig: { maxOutputTokens: 150 },
  });

  return result.response.text();
}

export function streamGeminiScore(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  notes: string,
  history: ChatMessage[]
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const client = getGeminiClient();
      const model = client.getGenerativeModel({ model: GEMINI_MODEL_MAP.pro });

      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: buildScoringPrompt(prompt, graph, notes, history) }] }],
        generationConfig: {
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });
}