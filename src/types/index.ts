// Shape metadata — what each vendor shape carries
export interface ShapeMeta {
    vendor: string;           // "postgresql" | "redis" | "kafka" etc.
    category: ShapeCategory;
    label: string;            // user-provided label, can be empty
    isLabeled: boolean;       // validation flag
}

export type ShapeCategory =
  | "database"
  | "cache"
  | "queue"
  | "server"
  | "client"
  | "cdn"
  | "storage"
  | "generic"
  | "annotation" // Standalone text nodes
  | "apiGateway"
  | "objectStorage"
  | "graphDb"
  | "loadBalancer"
  | "webServer"
  | "appServer"
  | "relationalDb"
  | "noSqlDb";

// The semantic graph sent to AI — NOT raw tldraw JSON
export interface SemanticNode {
  id: string;
  vendor: string;
  category: ShapeCategory;
  label: string;
  description?: string; // from text shapes near this node
  isGeneric?: boolean;  // true for basic rectangle/circle/etc shapes
}

export interface Annotation {
  id: string;
  text: string;
  // Future: we could add x,y position to associate with
  // nearby shapes, but for now just collect the text content
}

export interface SemanticEdge {
  from: string;
  to: string;
  label: string;           // mandatory for scoring — flagged if empty
  isLabeled: boolean;
}

export interface SemanticGraph {
  nodes: SemanticNode[];
  edges: SemanticEdge[];
  annotations: Annotation[];     // standalone text shapes
  unlabeledEdgeCount: number;
  unlabeledGenericCount: number; // generic shapes without labels
  isValid: boolean;        // false if any arrows are unlabeled
}

// AI interactions
export type AIModel = "haiku" | "flash" | "sonnet";  // flash/haiku=chat+hints, sonnet=scoring
export type LlmProvider = "anthropic" | "gemini";

export interface Hint {
  id: string;
  content: string;
  triggeredAt: number;     // canvas version that triggered this
  isRead: boolean;
}

export interface ScoreResult {
  score: number;
  breakdown?: {
    scalability: number;
    reliability: number;
    tradeoffs: number;
    completeness: number;
  };
  feedback?: string;
  missedConcepts?: string[];
  error?: string;
  isQuotaError?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: number;
  model?: AIModel;
}

// Session history — used by dashboard and session list components
export interface HistorySession {
  id: string
  promptId: string
  hintsUsed: number
  scoresUsed: number
  scoreResult: unknown  // Use getScore() from @/lib/utils for safe access
  status: "ACTIVE" | "SCORED" | "ABANDONED"
  createdAt: string
  updatedAt: string
}
