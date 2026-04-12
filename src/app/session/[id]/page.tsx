"use client";

import { use, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { TLStoreSnapshot } from "@tldraw/tldraw";

import type { ChatMessage, ScoreResult, SemanticGraph } from "@/types";
import { LIMITS } from "@/lib/limits";
import { useSessionStore } from "@/store/session";
import { InterviewCanvas } from "@/components/canvas/InterviewCanvas";
import {
  clearSessionLocally,
  loadSessionLocally,
  saveSessionLocally,
  type LocalSessionSnapshot,
} from "@/lib/indexeddb";
import {
  getRecordsFromCanvasSnapshot,
  isCanvasSnapshot,
  parseCanvasToGraph,
} from "@/lib/graph-parser";

import { SessionLayout } from "@/components/session/SessionLayout";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ScorePanel } from "@/components/score/ScorePanel";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { ExportButton } from "@/components/session/ExportButton";

function isSemanticGraph(value: unknown): value is SemanticGraph {
  if (!value || typeof value !== "object") return false;

  const graph = value as Record<string, unknown>;
  return (
    Array.isArray(graph.nodes) &&
    Array.isArray(graph.edges) &&
    Array.isArray(graph.annotations)
  );
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: urlSessionId } = use(params);
  const router = useRouter();
  const { data: authSession, status: authStatus } = useSession();
  const { syncFromServer, activePrompt, sessionId } = useSessionStore();
  
  const history = useSessionStore((s) => s.messages);
  const hints = useSessionStore((s) => s.hints);
  const hintsUsed = useSessionStore((s) => s.hintsUsed);
  const scoresUsed = useSessionStore((s) => s.scoresUsed);
  const setScoring = useSessionStore((s) => s.setScoring);
  const setScoreResult = useSessionStore((s) => s.setScoreResult);
  const setLastSentGraph = useSessionStore((s) => s.setLastSentGraph);
  const isScoring = useSessionStore((s) => s.isScoring);
  const llmProvider = useSessionStore((s) => s.llmProvider);
  const scoreResult = useSessionStore((s) => s.scoreResult);
  const syncScoresFromServer = useSessionStore((s) => s.syncScoresFromServer);

  // Restored notes state
  const notes = useSessionStore((s) => s.notes);
  const setNotes = useSessionStore((s) => s.setNotes);

  const latestGraphRef = useRef<SemanticGraph | null>(null);
  const latestCanvasSnapshotRef = useRef<TLStoreSnapshot | null>(null);
  const [currentGraph, setCurrentGraph] = useState<SemanticGraph | null>(null);
  const [initialCanvasSnapshot, setInitialCanvasSnapshot] = useState<TLStoreSnapshot | null>(null);
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resolvePrompt = useCallback(async (promptId?: string | null) => {
    if (!promptId) {
      return activePrompt
    }

    if (activePrompt?.id === promptId) {
      return activePrompt
    }

    const { PROMPTS } = await import("@/lib/prompts")
    const found = PROMPTS.find((prompt) => prompt.id === promptId) ?? null

    if (found) {
      useSessionStore.getState().setActivePrompt(found)
    }

    return found
  }, [activePrompt])

  const applyRecoveredSession = useCallback((options: {
    sessionId: string
    promptId?: string | null
    canvasState?: unknown
    localSession?: LocalSessionSnapshot | null
    chatHistory?: unknown
    hintsUsed?: number
    scoresUsed?: number
    scoreResult?: unknown
    showResume?: boolean
  }) => {
    const localSession = options.localSession ?? null
    const localChatHistory = Array.isArray(localSession?.chatHistory)
      ? localSession.chatHistory
      : []
    const restoredCanvasSnapshot = isCanvasSnapshot(options.canvasState)
      ? options.canvasState
      : isCanvasSnapshot(localSession?.canvasSnapshot)
        ? localSession.canvasSnapshot
        : null
    const restoredGraph = restoredCanvasSnapshot
      ? parseCanvasToGraph(getRecordsFromCanvasSnapshot(restoredCanvasSnapshot))
      : isSemanticGraph(options.canvasState)
        ? options.canvasState
        : isSemanticGraph(localSession?.graph)
          ? localSession.graph
          : null
    const restoredHints = Array.isArray(localSession?.hints)
      ? localSession.hints
      : []
    const restoredNotes =
      typeof localSession?.notes === "string" ? localSession.notes : ""
    const mergedHistory = Array.isArray(options.chatHistory) && options.chatHistory.length > 0
      ? options.chatHistory
      : localChatHistory
    const mergedHintsUsed = Math.max(options.hintsUsed ?? 0, localSession?.hintsUsed ?? 0)
    const mergedScoresUsed = Math.max(options.scoresUsed ?? 0, localSession?.scoresUsed ?? 0)
    const restoredScoreResult: ScoreResult | null =
      options.scoreResult && typeof options.scoreResult === "object"
        ? options.scoreResult as ScoreResult
        : localSession?.scoreResult ?? null

    syncFromServer({
      sessionId: options.sessionId,
      hintsUsed: mergedHintsUsed,
      scoresUsed: mergedScoresUsed,
      canvasState: restoredGraph,
      chatHistory: mergedHistory as ChatMessage[],
      hints: restoredHints,
      notes: restoredNotes,
      scoreResult: restoredScoreResult,
    })

    setCurrentGraph(restoredGraph)
    latestGraphRef.current = restoredGraph
    setInitialCanvasSnapshot(restoredCanvasSnapshot)
    latestCanvasSnapshotRef.current = restoredCanvasSnapshot
    setIsSessionHydrated(true)
    setSessionError(false)

    if (
      options.showResume &&
      (mergedHintsUsed > 0 ||
        mergedScoresUsed > 0 ||
        restoredGraph ||
        restoredHints.length > 0 ||
        restoredNotes.length > 0 ||
        mergedHistory.length > 0)
    ) {
      setShowResumeToast(true)
      setTimeout(() => setShowResumeToast(false), 3000)
    }

    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }, [syncFromServer])

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  // 1. Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace(`/login?from=/session/${urlSessionId}`);
    }
  }, [authStatus, router, urlSessionId]);

  // 1b. Tier guard: FREE users cannot access pro prompts via direct URL
  useEffect(() => {
    if (!isSessionHydrated || !activePrompt || authStatus !== "authenticated") return;

    const userTier = (authSession?.user as { tier?: string } | undefined)?.tier ?? "FREE";
    if (userTier !== "FREE") return; // PRO / PREMIUM: no restriction

    const { PROMPTS, FREE_PROMPT_COUNT } = require("@/lib/prompts") as {
      PROMPTS: { id: string }[];
      FREE_PROMPT_COUNT: number;
    };
    const freePromptIds = PROMPTS.slice(0, FREE_PROMPT_COUNT).map((p) => p.id);
    if (!freePromptIds.includes(activePrompt.id)) {
      router.replace("/");
    }
  }, [activePrompt, authSession, authStatus, isSessionHydrated, router]);

  // 2. On mount (once authenticated): call /api/session/start
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const startSession = async () => {
      setIsSessionHydrated(false);

      const localSession = await loadSessionLocally(urlSessionId);
      const resolvedPrompt = await resolvePrompt(activePrompt?.id ?? localSession?.promptId);

      if (!resolvedPrompt) {
        router.replace("/");
        return;
      }

      try {
        const res = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId: resolvedPrompt.id }),
        });

        if (!res.ok) throw new Error("Failed to start session");

        const data = await res.json();
        await resolvePrompt(data.promptId ?? resolvedPrompt.id);
        applyRecoveredSession({
          sessionId: data.sessionId,
          promptId: data.promptId ?? resolvedPrompt.id,
          canvasState: data.canvasState,
          localSession,
          chatHistory: data.chatHistory,
          hintsUsed: data.hintsUsed,
          scoresUsed: data.scoresUsed,
          scoreResult: data.scoreResult,
          showResume: true,
        });
      } catch (err) {
        console.error("Session start failed:", err);

        if (localSession) {
          applyRecoveredSession({
            sessionId: urlSessionId,
            promptId: localSession.promptId ?? resolvedPrompt.id,
            canvasState: localSession.canvasSnapshot ?? localSession.graph ?? null,
            localSession,
            chatHistory: localSession.chatHistory ?? [],
            hintsUsed: localSession.hintsUsed ?? 0,
            scoresUsed: localSession.scoresUsed ?? 0,
            scoreResult: localSession.scoreResult ?? null,
            showResume: true,
          });
          return;
        }

        setSessionError(true);
      }
    };

    startSession();
  }, [activePrompt, applyRecoveredSession, authStatus, resolvePrompt, router, urlSessionId]);

  const scheduleCanvasSave = useCallback((snapshot: TLStoreSnapshot) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      const latestGraph = latestGraphRef.current;

      // Primary: save to DB
      if (sessionId) {
        try {
          const res = await fetch(`/api/session/${sessionId}/canvas`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ canvasState: snapshot }),
          });
          if (!res.ok) throw new Error("Server save failed");
          if (latestGraph) {
            setLastSentGraph(latestGraph);
          }
        } catch {
          console.warn("[canvas] DB save failed, falling back to IndexedDB");
          // Fallback: IndexedDB
          saveSessionLocally(urlSessionId, {
            promptId: activePrompt?.id,
            graph: latestGraph,
            canvasSnapshot: snapshot,
            notes: useSessionStore.getState().notes,
            hints: useSessionStore.getState().hints,
            chatHistory: useSessionStore.getState().messages,
            scoreResult: useSessionStore.getState().scoreResult,
            hintsUsed: useSessionStore.getState().hintsUsed,
            scoresUsed: useSessionStore.getState().scoresUsed,
          });
          if (latestGraph) {
            setLastSentGraph(latestGraph);
          }
        }
      }
    }, 3000);
  }, [activePrompt?.id, sessionId, setLastSentGraph, urlSessionId]);

  const onSnapshotChange = useCallback((snapshot: TLStoreSnapshot) => {
    latestCanvasSnapshotRef.current = snapshot;
    scheduleCanvasSave(snapshot);
  }, [scheduleCanvasSave]);

  // Handle graph changes
  const onGraphChange = useCallback((g: SemanticGraph) => {
    latestGraphRef.current = g;
    setCurrentGraph(g);
  }, []);

  // Debounced local state save
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);

    notesSaveTimeoutRef.current = setTimeout(() => {
      saveSessionLocally(urlSessionId, {
        promptId: activePrompt?.id,
        graph: latestGraphRef.current,
        canvasSnapshot: latestCanvasSnapshotRef.current,
        notes,
        hints,
        chatHistory: history,
        scoreResult,
        hintsUsed,
        scoresUsed,
      });
    }, 1000);

    return () => {
      if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
    };
  }, [activePrompt?.id, hints, hintsUsed, history, notes, scoreResult, scoresUsed, urlSessionId]);

  const [isScorePanelOpen, setIsScorePanelOpen] = useState(false);

  const sanitizeJson = (raw: string): string => {
    return raw
      .trim()
      .replace(/^```json\s*/i, "") // strip opening ```json
      .replace(/^```\s*/i, "") // strip opening ``` (no lang tag)
      .replace(/```\s*$/i, "") // strip closing ```
      .trim();
  };

  async function handleScoreClick() {
    setIsScorePanelOpen(true);
    if (isScoring) return;

    if (scoresUsed >= LIMITS.free.scoresPerSession) return;
    if (!activePrompt || !latestGraphRef.current) return;

    setScoring(true);

    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          graph: latestGraphRef.current,
          history,
          llmProvider,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 && errorData.error === "free_limit_reached") {
          syncScoresFromServer(
            typeof errorData.scoresUsed === "number"
              ? errorData.scoresUsed
              : LIMITS.free.scoresPerSession
          );
          setScoreResult(null);
          return;
        }

        if (res.status === 429) {
          setScoreResult({
            score: -1,
            error: errorData.message ?? "Quota exceeded",
            isQuotaError: true,
          });
          return;
        }
        throw new Error(errorData.message ?? "Scoring failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let jsonText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        jsonText += decoder.decode(value, { stream: true });
      }
      jsonText += decoder.decode();

      try {
        const sanitized = sanitizeJson(jsonText);

        const parsed = JSON.parse(sanitized);

        if (typeof parsed.score !== "number") {
          throw new Error("Invalid score shape: missing score field");
        }

        setScoreResult(parsed);
        syncScoresFromServer(useSessionStore.getState().scoresUsed + 1);
      } catch {
        console.error("Score parse failed. Raw response was:", jsonText);
        setScoreResult({
          score: -1,
          error: "Received an invalid response from the AI. Try again.",
          isQuotaError: false,
        });
      }
    } catch (err) {
      setScoreResult({
        score: -1,
        error:
          err instanceof Error
            ? err.message
            : "Scoring failed. Try again.",
        isQuotaError: false,
      });
    } finally {
      setScoring(false);
    }
  }

  const handleClearSession = async () => {
    if (!confirm("Clear your drawing and notes? This cannot be undone.")) return;

    await clearSessionLocally(urlSessionId);

    // Reset state
    setNotes("");
    setScoreResult(null);
    setCurrentGraph(null);
    setInitialCanvasSnapshot(null);
    latestCanvasSnapshotRef.current = null;
    latestGraphRef.current = null;
    useSessionStore.setState({
      hints: [],
      messages: [],
      unreadHintCount: 0,
      lastSentGraph: null,
    });
    // Note: tldraw canvas needs a manual reset usually, 
    // but clearing the session locally means on refresh it's gone.
    // For immediate UI reset, we'd need to talk to tldraw editor instance.
    window.location.reload();
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") return null;

  if (sessionError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Failed to load session.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="mt-4 text-blue-400 text-sm hover:text-blue-300 underline"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId || !isSessionHydrated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Initializing session...</p>
        </div>
      </div>
    );
  }

  if (!activePrompt) return null;

  return (
    <div className="relative h-full w-full">
      <SessionLayout
        left={
          <InterviewCanvas
            onGraphChange={onGraphChange}
            onSnapshotChange={onSnapshotChange}
            initialSnapshot={initialCanvasSnapshot}
          />
        }
        chat={<ChatPanel graph={currentGraph} />}
        notes={<NotesPanel />}
        exportButton={<div id="export-button-portal" className="flex items-center min-w-[70px] justify-end" />}
        onScoreClick={handleScoreClick}
        onClearSession={handleClearSession}
        isScorePanelOpen={isScorePanelOpen}
        onCloseScorePanel={() => setIsScorePanelOpen(false)}
        scorePanel={<ScorePanel />}
        scoreButtonDisabled={isScoring || !currentGraph || currentGraph.nodes.length === 0}
        scoreButtonTooltip="Draw your architecture before scoring"
      />

      {showToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-gray-900 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 text-sm font-medium">
          Recovered local draft.
        </div>
      )}

      {showResumeToast && (
        <div 
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500" 
          style={{ bottom: "24px", left: "50%", transform: "translateX(-50%)" }}
        >
          Reopened previous work.
        </div>
      )}
    </div>
  );
}
