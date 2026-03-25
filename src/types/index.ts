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
    | "storage";
  
  // The semantic graph sent to AI — NOT raw tldraw JSON
  export interface SemanticNode {
    id: string;
    vendor: string;
    category: ShapeCategory;
    label: string;
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
    unlabeledEdgeCount: number;
    isValid: boolean;        // false if any arrows are unlabeled
  }
  
  // AI interactions
  export type AIModel = "haiku" | "sonnet";  // haiku=hints, sonnet=scoring
  
  export interface Hint {
    id: string;
    content: string;
    triggeredAt: number;     // canvas version that triggered this
    isRead: boolean;
  }
  
  export interface ScoreResult {
    score: number;
    breakdown: {
      scalability: number;
      reliability: number;
      tradeoffs: number;
      completeness: number;
    };
    feedback: string;
    missedConcepts: string[];
  }
  
  export interface ChatMessage {
    id: string;
    role: "ai" | "user";
    content: string;
    timestamp: number;
    model?: AIModel;
  }