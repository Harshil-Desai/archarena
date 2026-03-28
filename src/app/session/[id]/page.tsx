"use client";

import { use, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const { id } = use(params);
  const router = useRouter();
  const activePrompt = useSessionStore((s) => s.activePrompt);

  useEffect(() => {
    if (!activePrompt) {
      router.push("/");
    }
  }, [activePrompt, router]);

  const history = useSessionStore((s) => s.messages);
  const scoresUsed = useSessionStore((s) => s.scoresUsed);
  const incrementScores = useSessionStore((s) => s.incrementScores);
  const setScoring = useSessionStore((s) => s.setScoring);
  const setScoreResult = useSessionStore((s) => s.setScoreResult);
  const isScoring = useSessionStore((s) => s.isScoring);
  const llmProvider = useSessionStore((s) => s.llmProvider);
  
  // Restored notes state
  const notes = useSessionStore((s) => s.notes);
  const setNotes = useSessionStore((s) => s.setNotes);

  const latestGraphRef = useRef<SemanticGraph | null>(null);
  const [currentGraph, setCurrentGraph] = useState<SemanticGraph | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Restore session from IndexedDB on mount
  useEffect(() => {
    async function restore() {
      try {
        const result = await loadSessionLocally(id);
        if (result) {
          if (result.graph) {
            setCurrentGraph(result.graph);
            latestGraphRef.current = result.graph;
          }
          if (result.notes) {
            setNotes(result.notes);
          }
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      } catch (err) {
        console.warn("Failed to load session from IndexedDB", err);
      }
    }
    restore();
  }, [id, setNotes]);

  // Handle graph changes & Auto-save
  const onGraphChange = useCallback((g: SemanticGraph) => {
    latestGraphRef.current = g;
    setCurrentGraph(g);
    
    // Fire-and-forget save
    saveSessionLocally(id, { 
      graph: g, 
      notes: useSessionStore.getState().notes 
    }).catch(err => console.warn("Save failed", err));
  }, [id]);

  // Debounced notes save
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
    
    notesSaveTimeoutRef.current = setTimeout(() => {
      saveSessionLocally(id, { 
        graph: latestGraphRef.current, 
        notes: notes 
      }).catch(err => console.warn("Notes save failed", err));
    }, 1000);

    return () => {
      if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
    };
  }, [notes, id]);

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

    incrementScores();
    setScoring(true);

    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          graph: latestGraphRef.current,
          history,
          scoresUsed,
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
    
    await clearSessionLocally(id);
    
    // Reset state
    setNotes("");
    setScoreResult(null);
    useSessionStore.setState({ hints: [], messages: [] });
    // Note: tldraw canvas needs a manual reset usually, 
    // but clearing the session locally means on refresh it's gone.
    // For immediate UI reset, we'd need to talk to tldraw editor instance.
    window.location.reload(); 
  };

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
    </div>
  );
}
