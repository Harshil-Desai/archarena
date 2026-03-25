import Anthropic from "@anthropic-ai/sdk";
import { DesignPrompt } from "./prompts";
import { ChatMessage, SemanticGraph, AIModel } from "@/types";

const client = new Anthropic();

// Model routing — fast for hints, strong for scoring
export const MODEL_MAP: Record<AIModel, string> = {
  haiku: "claude-haiku-4-5-20251001",    // background hints, chat
  sonnet: "claude-sonnet-4-6",           // final scoring
};

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