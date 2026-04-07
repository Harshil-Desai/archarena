import { create } from "zustand";
import { DesignPrompt } from "@/lib/prompts";
import { ChatMessage, Hint, LlmProvider, ScoreResult, SemanticGraph } from "@/types";

interface SessionState {
  // Prompt
  activePrompt: DesignPrompt | null;
  setActivePrompt: (p: DesignPrompt) => void;

  // Notes
  notes: string;
  setNotes: (n: string) => void;

  // Session tracking
  sessionId: string | null;
  setSessionId: (id: string) => void;

  syncFromServer: (data: {
    sessionId: string;
    hintsUsed: number;
    scoresUsed: number;
    canvasState: SemanticGraph | null;
    chatHistory: ChatMessage[];
    hints?: Hint[];
    notes?: string;
    scoreResult: ScoreResult | null;
  }) => void;

  // Canvas delta tracking
  lastSentGraph: SemanticGraph | null;
  setLastSentGraph: (g: SemanticGraph) => void;

  // Background hints queue (from fast model)
  hints: Hint[];
  addHint: (h: Hint) => void;
  markHintRead: (id: string) => void;
  markAllHintsRead: () => void;
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
  setScoreResult: (r: ScoreResult | null) => void;

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
  incrementHintsUsed: () => void;
  incrementScoresUsed: () => void;
  syncHintsFromServer: (hintsUsed: number) => void;
  syncScoresFromServer: (scoresUsed: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activePrompt: null,
  setActivePrompt: (p) => set({ activePrompt: p }),

  notes: "",
  setNotes: (n) => set({ notes: n }),

  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  syncFromServer: (data) => set({
    sessionId: data.sessionId,
    hintsUsed: data.hintsUsed,
    scoresUsed: data.scoresUsed,
    lastSentGraph: data.canvasState,
    notes: data.notes ?? "",
    hints: data.hints ?? [],
    unreadHintCount: (data.hints ?? []).filter((hint) => !hint.isRead).length,
    scoreResult: data.scoreResult,
    messages: data.chatHistory ?? [],
  }),

  lastSentGraph: null,
  setLastSentGraph: (g) => set({ lastSentGraph: g }),

  hints: [],
  addHint: (h) => set((s) => ({
    hints: [...s.hints, h],
    unreadHintCount: h.isRead ? s.unreadHintCount : s.unreadHintCount + 1,
  })),
  markHintRead: (id) => set((s) => {
    const target = s.hints.find((hint) => hint.id === id);
    if (!target || target.isRead) {
      return s;
    }

    return {
      hints: s.hints.map((hint) =>
        hint.id === id ? { ...hint, isRead: true } : hint
      ),
      unreadHintCount: Math.max(0, s.unreadHintCount - 1),
    };
  }),
  markAllHintsRead: () => set((s) => ({
    hints: s.hints.map((hint) => ({ ...hint, isRead: true })),
    unreadHintCount: 0,
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
  incrementHintsUsed: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),
  incrementScoresUsed: () => set((s) => ({ scoresUsed: s.scoresUsed + 1 })),
  syncHintsFromServer: (hintsUsed) => set({ hintsUsed }),
  syncScoresFromServer: (scoresUsed) => set({ scoresUsed }),
}));
