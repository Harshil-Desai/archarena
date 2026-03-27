import { create } from "zustand";
import { DesignPrompt } from "@/lib/prompts";
import { ChatMessage, Hint, LlmProvider, ScoreResult, SemanticGraph } from "@/types";
import { TLRecord } from "@tldraw/tldraw";

interface SessionState {
  // Prompt
  activePrompt: DesignPrompt | null;
  setActivePrompt: (p: DesignPrompt) => void;

  // Notes
  notes: string;
  setNotes: (n: string) => void;

  // Canvas delta tracking
  lastSentGraph: SemanticGraph | null;
  setLastSentGraph: (g: SemanticGraph) => void;

  // Background hints queue (from fast model)
  hints: Hint[];
  addHint: (h: Hint) => void;
  markHintRead: (id: string) => void;
  unreadHintCount: number;

  // Chat (user ↔ AI back-and-forth)
  messages: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  isAiThinking: boolean;
  setAiThinking: (v: boolean) => void;

  // Score (separate from chat)
  scoreResult: ScoreResult | null;
  isScoring: boolean;
  setScoring: (v: boolean) => void;
  setScoreResult: (r: ScoreResult) => void;

  // Timer
  secondsElapsed: number;
  isRunning: boolean;
  startTimer: () => void;
  tickTimer: () => void;

  // LLM provider toggle
  llmProvider: LlmProvider;
  setLlmProvider: (provider: LlmProvider) => void;

  // Usage counters (free tier enforcement)
  hintsUsed: number;
  scoresUsed: number;
  incrementHints: () => void;
  incrementScores: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activePrompt: null,
  setActivePrompt: (p) => set({ activePrompt: p }),

  notes: "",
  setNotes: (n) => set({ notes: n }),

  lastSentGraph: null,
  setLastSentGraph: (g) => set({ lastSentGraph: g }),

  hints: [],
  addHint: (h) => set((s) => ({
    hints: [...s.hints, h],
    unreadHintCount: s.unreadHintCount + 1,
  })),
  markHintRead: (id) => set((s) => ({
    hints: s.hints.map((h) => h.id === id ? { ...h, isRead: true } : h),
    unreadHintCount: Math.max(0, s.unreadHintCount - 1),
  })),
  unreadHintCount: 0,

  messages: [],
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  updateLastMessage: (content) => set((s) => {
    const msgs = [...s.messages];
    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
    return { messages: msgs };
  }),
  isAiThinking: false,
  setAiThinking: (v) => set({ isAiThinking: v }),

  scoreResult: null,
  isScoring: false,
  setScoring: (v) => set({ isScoring: v }),
  setScoreResult: (r) => set({ scoreResult: r }),

  secondsElapsed: 0,
  isRunning: false,
  startTimer: () => set({ isRunning: true }),
  tickTimer: () => set((s) => ({ secondsElapsed: s.secondsElapsed + 1 })),

  llmProvider: "anthropic",
  setLlmProvider: (provider) => set({ llmProvider: provider }),

  hintsUsed: 0,
  scoresUsed: 0,
  incrementHints: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),
  incrementScores: () => set((s) => ({ scoresUsed: s.scoresUsed + 1 })),
}));