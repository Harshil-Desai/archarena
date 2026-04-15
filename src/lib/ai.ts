import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DesignPrompt } from "./prompts";
import { ChatMessage, SemanticGraph, AIModel, LlmProvider } from "@/types";

// ── Input truncation limits (cost control) ─────────────────────────
const LIMITS_AI = {
  maxNodes: 20,
  maxEdges: 30,
  maxAnnotationLength: 200,
  maxAnnotations: 5,
  maxLabelLength: 60,
  maxEdgeLabelLength: 80,
  maxHistoryMessages: 6,
  maxHistoryMessageLength: 300,
  MAX_VOICE_TOKENS: 200,
} as const

export function truncateGraphForAI(graph: SemanticGraph): SemanticGraph {
  return {
    nodes: graph.nodes
      .slice(0, LIMITS_AI.maxNodes)
      .map(n => ({
        ...n,
        label: n.label.slice(0, LIMITS_AI.maxLabelLength),
      })),
    edges: graph.edges
      .slice(0, LIMITS_AI.maxEdges)
      .map(e => ({
        ...e,
        label: e.label.slice(0, LIMITS_AI.maxEdgeLabelLength),
      })),
    annotations: graph.annotations
      .slice(0, LIMITS_AI.maxAnnotations)
      .map(a => ({
        ...a,
        text: a.text.slice(0, LIMITS_AI.maxAnnotationLength),
      })),
    unlabeledEdgeCount: graph.unlabeledEdgeCount,
    unlabeledGenericCount: graph.unlabeledGenericCount,
    isValid: graph.isValid,
  }
}

export function truncateHistoryForAI(history: ChatMessage[]): ChatMessage[] {
  return history
    .slice(-LIMITS_AI.maxHistoryMessages)
    .map(m => ({
      ...m,
      content: m.content.slice(0, LIMITS_AI.maxHistoryMessageLength),
    }))
}

/**
 * Truncate text to approximate token budget.
 * Uses 4 chars/token heuristic for English text.
 */
export function truncateToTokenBudget(
  text: string,
  maxTokens: number = LIMITS_AI.MAX_VOICE_TOKENS
): string {
  const maxChars = maxTokens * 4
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars).trimEnd() + '...'
}

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
export const MODEL_MAP: Record<Exclude<AIModel, "flash">, string> = {
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
  pro: "gemini-2.5-pro",          // final scoring
} as const;

// ── Prompt builders (model-agnostic) ───────────────────────────────

export function formatGraphForPrompt(graph: SemanticGraph): string {
  const allNodes = graph.nodes;

  if (allNodes.length === 0) {
    return "The canvas is empty — no components have been drawn yet.";
  }

  // Separate vendor and generic nodes for clarity
  const vendorNodes = allNodes.filter((n) => !n.isGeneric);
  const genericNodes = allNodes.filter((n) => n.isGeneric);

  const lines: string[] = [];

  if (vendorNodes.length > 0) {
    lines.push("Named technology components:");
    vendorNodes.forEach((n) => {
      lines.push(`  - ${n.label} (${n.vendor}, ${n.category})`);
    });
  }

  if (genericNodes.length > 0) {
    lines.push("Generic/unlabeled components:");
    genericNodes.forEach((n) => {
      const labelNote = ["rectangle", "ellipse", "diamond", "component"].includes(n.label)
        ? `${n.label} — no label assigned yet`
        : n.label;
      lines.push(`  - ${labelNote}`);
    });
  }

  if (graph.edges.length > 0) {
    lines.push("\nData flows between components:");
    graph.edges.forEach((e) => {
      const fromNode = allNodes.find((n) => n.id === e.from);
      const toNode = allNodes.find((n) => n.id === e.to);
      const fromLabel = fromNode?.label ?? "unknown";
      const toLabel = toNode?.label ?? "unknown";
      const flowLabel = e.label
        ? `"${e.label}"`
        : "(flow direction shown but not labeled)";
      lines.push(`  - ${fromLabel} → ${toLabel}: ${flowLabel}`);
    });
  } else {
    lines.push("\nNo connections drawn yet — components are isolated.");
  }

  if (graph.annotations.length > 0) {
    lines.push("\nCandidate annotations / notes on canvas:");
    graph.annotations.forEach((a) => {
      lines.push(`  - "${a.text}"`);
    });
  }

  if (graph.unlabeledEdgeCount > 0) {
    lines.push(
      `\nWarning: ${graph.unlabeledEdgeCount} connection(s) have no label — ` +
      `data flow direction or purpose is unclear.`
    );
  }

  if (graph.unlabeledGenericCount > 0) {
    lines.push(
      `Note: ${graph.unlabeledGenericCount} generic shape(s) have no label — ` +
      `their role in the architecture is ambiguous.`
    );
  }

  return lines.join("\n");
}

function formatHistoryForPrompt(history: ChatMessage[] = []): string {
  if (history.length === 0) {
    return "No prior conversation yet."
  }

  return history
    .map((message) => {
      const speaker = message.role === "user" ? "Candidate" : "Interviewer"
      return `${speaker}: ${message.content}`
    })
    .join("\n")
}

// PROMPT 1 — background hint (fast model)
export function buildHintPrompt(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[] = []
): string {
  const safeHistory = truncateHistoryForAI(history)
  const previousHints = safeHistory
    .filter((m) => m.role === 'ai')
    .map((m) => `- ${m.content}`)
    .join('\n')

  const canvasContext = formatGraphForPrompt(truncateGraphForAI(graph));

  return `You are a senior staff engineer at a top-tier tech company
conducting a system design interview. You are watching the candidate
build their architecture diagram in real time.

## The Question
"${prompt.title}" — ${prompt.description}

## Current Architecture
${canvasContext}

## Scoring Criteria (what a full solution should address)
${prompt.scoringCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Hints Already Given (do NOT repeat these)
${previousHints || 'None yet — this is the first hint.'}

## Your Task
Give the candidate ONE meaningful hint.
A good hint for this context:
- Is specific to what you actually see on THEIR canvas right now
- Identifies a concrete gap, missing component, or unconsidered failure mode — not a generic "think about scalability" platitude
- Asks a pointed question OR makes a specific observation
- Does NOT give away the solution — nudge, don't answer
- References specific components by the name the candidate gave them
- If the candidate has generic unlabeled shapes (rectangles or circles without meaningful labels), note that these represent unclear components — mention that naming them would help clarify the architecture, but still give a substantive hint about what you CAN see.

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
  const canvasContext = formatGraphForPrompt(truncateGraphForAI(graph));
  const historyContext = formatHistoryForPrompt(truncateHistoryForAI(history));

  return `You are a senior staff engineer scoring a system design interview.

## Question
"${prompt.title}" — ${prompt.description}

## Scoring Criteria
${prompt.scoringCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

## Submitted Architecture
${canvasContext}

## Candidate Clarifications And Discussion
${historyContext}

Use the chat history to give credit for tradeoffs, clarifications, and constraints the candidate explicitly discussed, even if every detail is not visible on the canvas.

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

export function buildChatPrompt(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[]
): string {
  const canvasContext = formatGraphForPrompt(truncateGraphForAI(graph))
  const historyContext = formatHistoryForPrompt(truncateHistoryForAI(history))

  return `You are a senior staff engineer conducting a live system design interview.

## Interview Question
"${prompt.title}" — ${prompt.description}

## Current Architecture
${canvasContext}

## Conversation So Far
${historyContext}

## Your Task
Reply as the interviewer to the candidate's latest message.

Rules:
- Answer the latest question directly.
- Stay grounded in the actual canvas and conversation, not a generic textbook answer.
- Push the candidate forward with one concrete follow-up or tradeoff when useful.
- Do not dump a full solution.
- Keep the response concise: 2-4 sentences.
- Do not use bullet points.
- Do not add labels like "Interviewer:".

Write the response directly and stop.`
}

// ── Anthropic implementations ──────────────────────────────────────

export async function generateAnthropicHint(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[] = []
): Promise<string> {
  const message = await anthropicClient.messages.create({
    model: MODEL_MAP.haiku,
    max_tokens: 150,
    stop_sequences: ['\n\n'],
    messages: [{ role: "user", content: buildHintPrompt(prompt, graph, history) }],
  });

  // safe cast — Anthropic always returns text for non-tool messages
  const hint = (message.content[0] as { type: "text"; text: string }).text;
  return hint;
}

export async function generateAnthropicChatReply(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[]
): Promise<string> {
  const message = await anthropicClient.messages.create({
    model: MODEL_MAP.haiku,
    max_tokens: 220,
    messages: [{ role: "user", content: buildChatPrompt(prompt, graph, history) }],
  })

  return (message.content[0] as { type: "text"; text: string }).text.trim()
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
    generationConfig: { maxOutputTokens: 150 },
  });

  return result.response.text();
}

export async function generateGeminiChatReply(
  prompt: DesignPrompt,
  graph: SemanticGraph,
  history: ChatMessage[]
): Promise<string> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: GEMINI_MODEL_MAP.flash })

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildChatPrompt(prompt, graph, history) }] }],
    generationConfig: { maxOutputTokens: 300 },
  })

  return result.response.text().trim()
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
