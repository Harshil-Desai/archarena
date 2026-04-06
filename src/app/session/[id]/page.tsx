"use client";

import { use, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import type { SemanticGraph, ScoreResult } from "@/types";
import { LIMITS } from "@/lib/limits";
import { useSessionStore } from "@/store/session";
import { InterviewCanvas } from "@/components/canvas/InterviewCanvas";
import { loadSessionLocally, saveSessionLocally, clearSessionLocally } from "@/lib/indexeddb";

import { SessionLayout } from "@/components/session/SessionLayout";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ScorePanel } from "@/components/score/ScorePanel";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { useCanvasValidation } from "@/components/canvas/validation/useCanvasValidation";

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
  const scoresUsed = useSessionStore((s) => s.scoresUsed);
  const setScoring = useSessionStore((s) => s.setScoring);
  const setScoreResult = useSessionStore((s) => s.setScoreResult);
  const isScoring = useSessionStore((s) => s.isScoring);
  const llmProvider = useSessionStore((s) => s.llmProvider);
  const syncScoresFromServer = useSessionStore((s) => s.syncScoresFromServer);

  // Restored notes state
  const notes = useSessionStore((s) => s.notes);
  const setNotes = useSessionStore((s) => s.setNotes);

  const latestGraphRef = useRef<SemanticGraph | null>(null);
  const savedCanvasRef = useRef<SemanticGraph | null>(null);
  const [currentGraph, setCurrentGraph] = useState<SemanticGraph | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 2. On mount (once authenticated): call /api/session/start
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const startSession = async () => {
      if (!activePrompt) {
        router.replace("/");
        return;
      }
      try {
        const res = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId: activePrompt.id }),
        });

        if (!res.ok) throw new Error("Failed to start session");

        const data = await res.json();

        if (!activePrompt && data.promptId) {
          const { PROMPTS } = await import("@/lib/prompts");
          const found = PROMPTS.find((p) => p.id === data.promptId);
          if (found) useSessionStore.getState().setActivePrompt(found);
          else { router.replace("/"); return; }
        }

        syncFromServer({
          sessionId: data.sessionId,
          hintsUsed: data.hintsUsed,
          scoresUsed: data.scoresUsed,
          canvasState: data.canvasState,
          chatHistory: data.chatHistory ?? [],
          scoreResult: data.scoreResult,
        });

        if (data.hintsUsed > 0 || data.canvasState) {
          setShowResumeToast(true);
          setTimeout(() => setShowResumeToast(false), 3000);
        }

        if (data.canvasState) {
          savedCanvasRef.current = data.canvasState;
          setCurrentGraph(data.canvasState);
          latestGraphRef.current = data.canvasState;
        }
        
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error("Session start failed:", err);
        setSessionError(true);
      }
    };

    startSession();
  }, [authStatus, activePrompt, router, syncFromServer]);

  // Handle graph changes & Auto-save
  const onGraphChange = useCallback((g: SemanticGraph) => {
    latestGraphRef.current = g;
    setCurrentGraph(g);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      // Primary: save to DB
      if (sessionId) {
        try {
          const res = await fetch(`/api/session/${sessionId}/canvas`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ canvasState: g }),
          });
          if (!res.ok) throw new Error("Server save failed");
        } catch (err) {
          console.warn("[canvas] DB save failed, falling back to IndexedDB");
          // Fallback: IndexedDB
          saveSessionLocally(urlSessionId, { graph: g, notes: useSessionStore.getState().notes });
        }
      }
    }, 3000);
  }, [sessionId, urlSessionId]);

  // Debounced notes save
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);

    notesSaveTimeoutRef.current = setTimeout(() => {
      saveSessionLocally(urlSessionId, {
        graph: latestGraphRef.current,
        notes: notes
      }).catch(err => console.warn("Notes save failed", err));
    }, 1000);

    return () => {
      if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
    };
  }, [notes, urlSessionId]);

  const [isScorePanelOpen, setIsScorePanelOpen] = useState(false);

  const { canRequestHint, reason: hintReason } = useCanvasValidation(currentGraph);

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

        if (process.env.NODE_ENV === "development") {
          console.log("[score] raw response:", jsonText.slice(0, 200));
          console.log("[score] sanitized:", sanitized.slice(0, 200));
        }

        const parsed = JSON.parse(sanitized);

        if (typeof parsed.score !== "number") {
          throw new Error("Invalid score shape: missing score field");
        }

        setScoreResult(parsed);
        syncScoresFromServer(scoresUsed + 1);
      } catch (err) {
        console.error("Score parse failed. Raw response was:", jsonText);
        setScoreResult({
          score: -1,
          error: "Received an invalid response from the AI. Try again.",
          isQuotaError: false,
        });
      }
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
    useSessionStore.setState({ hints: [], messages: [] });
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

  if (!sessionId) {
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
        left={<InterviewCanvas onGraphChange={onGraphChange} />}
        chat={<ChatPanel graph={currentGraph} />}
        notes={<NotesPanel />}
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
          ✨ Session restored
        </div>
      )}

      {showResumeToast && (
        <div 
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500" 
          style={{ bottom: "24px", left: "50%", transform: "translateX(-50%)" }}
        >
          Session resumed — your progress has been restored
        </div>
      )}
    </div>
  );
}
