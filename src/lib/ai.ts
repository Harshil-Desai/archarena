import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DesignPrompt } from "./prompts";
import { ChatMessage, SemanticGraph, AIModel, LlmProvider } from "@/types";

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
  pro: "gemini-2.5-flash",       // final scoring
} as const;

// ── Prompt builders (model-agnostic) ───────────────────────────────

export function formatGraphForPrompt(graph: SemanticGraph): string {
  const nodeList = graph.nodes
    .map((n) => `- ${n.label} (${n.vendor}, ${n.category})`)
    .join('\n')
  const edgeList = graph.edges.length > 0
    ? graph.edges
      .map((e) => {
        const from = graph.nodes.find((n) => n.id === e.from)?.label ?? 'unknown'
        const to = graph.nodes.find((n) => n.id === e.to)?.label ?? 'unknown'
        return `- ${from} → ${to}${e.label ? `: "${e.label}"` : ' (flow unlabeled)'}`
      })
      .join('\n')
    : 'No connections drawn yet.'
  return `Components:\n${nodeList || 'None'}\n\nData flows:\n${edgeList}`
}

// PROMPT 1 — background hint (fast model)
export function buildHintPrompt(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[] = []
): string {
  const previousHints = history
    .filter((m) => m.role === 'ai')
    .map((m) => `- ${m.content}`)
    .join('\n')

  return `You are a senior staff engineer at a top-tier tech company
conducting a system design interview. You are watching the candidate
build their architecture diagram in real time.

The Question
"${prompt.title}" — ${prompt.description}

Their Current Architecture
${formatGraphForPrompt(graph)}
${graph.unlabeledEdgeCount > 0 ? `\nNote: ${graph.unlabeledEdgeCount} connection(s) have no label — data flow direction is unclear.` : ""}

Scoring Criteria (what a full solution should address)
${prompt.scoringCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Hints Already Given (do NOT repeat these)
${previousHints || 'None yet — this is the first hint.'}

Your Task
Give the candidate ONE meaningful hint.
A good hint for this context:
- Is specific to what you actually see on THEIR canvas right now
- Identifies a concrete gap, missing component, or unconsidered failure mode — not a generic "think about scalability" platitude
- Asks a pointed question OR makes a specific observation
- Does NOT give away the solution — nudge, don't answer
- References specific components by the name the candidate gave them

If the canvas is sparse (fewer than 3 components), ask them to clarify the scale requirements and core user flows first before diving into implementation details.

Your response must be exactly 1-2 sentences. No more.
Write the complete thought in those 1-2 sentences and stop.
Do not use bullet points. Do not add any preamble or sign-off.
Start writing the hint directly. End with a period.

Example of correct length:
"You have a load balancer routing to your API servers, but there's no session affinity configured — if a user's request hits a different server each time, how are you handling shared state like auth tokens?"

That is the length. Match it exactly.`
}

// PROMPT 2 — final score (strong model)
export function buildScoringPrompt(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[]
): string {
  return `You are a senior staff engineer scoring a system design interview.

Question: "${prompt.title}" — ${prompt.description}

Scoring criteria:
${prompt.scoringCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Final architecture submitted:
${formatGraphForPrompt(graph)}

  Respond with ONLY a raw JSON object. 
No markdown. No code fences. No backticks. No explanation. 
The very first character of your response must be '{' and 
the very last must be '}'.

{
  "score": <number 0-99>,
  "breakdown": {
    "scalability": <number 0-25>,
    "reliability": <number 0-25>,
    "tradeoffs": <number 0-25>,
    "completeness": <number 0-25>
  },
  "feedback": "<2-3 sentence summary referencing their actual components>",
  "missedConcepts": ["<specific concept>", "..."]
}`
}

// ── Anthropic implementations ──────────────────────────────────────

export async function generateAnthropicHint(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[] = []
): Promise<string> {
  const message = await anthropicClient.messages.create({
    model: MODEL_MAP.haiku,
    max_tokens: 120,
    stop_sequences: ['\n\n'],
    messages: [{ role: "user", content: buildHintPrompt(prompt, graph, history) }],
  });

  // safe cast — Anthropic always returns text for non-tool messages
  const hint = (message.content[0] as { type: "text"; text: string }).text;
  return hint;
}

// ── Gemini implementations ─────────────────────────────────────────

export async function generateGeminiHint(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[] = []
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: GEMINI_MODEL_MAP.flash });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildHintPrompt(prompt, graph, history) }] }],
    generationConfig: { maxOutputTokens: 1000 },
  });

  return result.response.text();
}

export async function createScoringStream(
  promptText: string,
  provider: LlmProvider
): Promise<ReadableStream> {
  if (provider === "anthropic") {
    // Anthropic stream initializes lazily — pre-flight it
    const stream = anthropicClient.messages.stream({
      model: MODEL_MAP.sonnet,
      max_tokens: 1000,
      messages: [{ role: "user", content: promptText }],
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  if (provider === "gemini") {
    const geminiClient = getGeminiClient();
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODEL_MAP.pro,
    });

    // Call generateContentStream and AWAIT it here so quota 
    // errors throw synchronously before we return the ReadableStream
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      generationConfig: { maxOutputTokens: 10000 },
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  throw new Error(`Unknown provider: ${provider}`);
}