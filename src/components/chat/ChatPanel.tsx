"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { TLRecord } from "@tldraw/tldraw";
import { parseCanvasToGraph, hasGraphChanged } from "@/lib/graph-parser";
import type { SemanticGraph } from "@/types";
import { useSessionStore } from "@/store/session";
import { LIMITS } from "@/lib/limits";

const INACTIVITY_MS = 4000;

const amberUpgradeNudgeClasses =
  "bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 text-amber-200 text-sm";
const disabledUpgradeButtonClasses =
  "bg-amber-600 text-white px-3 py-1 rounded text-xs opacity-50 cursor-not-allowed";

export function ChatPanel({ canvasRecords }: { canvasRecords: TLRecord[] }) {
  const activePrompt = useSessionStore((s) => s.activePrompt);
  const notes = useSessionStore((s) => s.notes);
  const hintsUsed = useSessionStore((s) => s.hintsUsed);
  const isAiThinking = useSessionStore((s) => s.isAiThinking);
  const hints = useSessionStore((s) => s.hints);
  const addHint = useSessionStore((s) => s.addHint);
  const markHintRead = useSessionStore((s) => s.markHintRead);
  const incrementHints = useSessionStore((s) => s.incrementHints);
  const setAiThinking = useSessionStore((s) => s.setAiThinking);

  const [error, setError] = useState<string | null>(null);

  const lastHintGraphRef = useRef<SemanticGraph | null>(null);
  const pendingGraphRef = useRef<SemanticGraph | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);

  const canAskForHint = useMemo(() => {
    return hintsUsed < LIMITS.free.aiHintsPerSession;
  }, [hintsUsed]);

  const requestHint = useCallback(
    async (graph: SemanticGraph) => {
      setError(null);
      if (!activePrompt) return;
      if (!canAskForHint) return;
      if (isAiThinking) return;
      if (!graph) return;

      // Prevent duplicated requests for the same architecture graph.
      if (!hasGraphChanged(lastHintGraphRef.current, graph)) return;
      lastHintGraphRef.current = graph;

      setAiThinking(true);
      try {
        const res = await fetch("/api/ai/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: activePrompt,
            graph,
            notes,
            hintsUsed,
          }),
        });

        if (!res.ok) {
          // If the server returns a 403, treat it as "no more hints" for this session.
          if (res.status === 403) return;
          throw new Error(`Hint request failed (${res.status})`);
        }

        const data: unknown = await res.json();
        const hint =
          typeof data === "object" && data != null
            ? (data as { hint?: unknown }).hint
            : undefined;

        if (typeof hint === "string") {
          addHint({
            id: nanoid(10),
            content: hint,
            triggeredAt: Date.now(),
            isRead: false,
          });
          incrementHints();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setAiThinking(false);
      }
    },
    [
      activePrompt,
      addHint,
      canAskForHint,
      incrementHints,
      isAiThinking,
      hintsUsed,
      notes,
      setAiThinking,
    ]
  );

  // Auto-trigger hint after a period of inactivity (no new canvas changes).
  useEffect(() => {
    // Always clear before deciding whether to schedule again.
    if (inactivityTimeoutRef.current != null) {
      window.clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }

    if (!activePrompt) return;
    if (!canAskForHint) return; // Stop auto-triggering entirely when locked.
    if (isAiThinking) return;
    if (!canvasRecords || canvasRecords.length === 0) return;

    const graph = parseCanvasToGraph(canvasRecords);
    if (graph.nodes.length === 0 && graph.edges.length === 0) return;

    // Only schedule when the semantic graph meaningfully changed.
    if (!hasGraphChanged(lastHintGraphRef.current, graph)) return;

    pendingGraphRef.current = graph;
    inactivityTimeoutRef.current = window.setTimeout(() => {
      inactivityTimeoutRef.current = null;
      const toRequest = pendingGraphRef.current;
      pendingGraphRef.current = null;
      if (toRequest) void requestHint(toRequest);
    }, INACTIVITY_MS);

    return () => {
      if (inactivityTimeoutRef.current != null) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, [
    activePrompt,
    canAskForHint,
    canvasRecords,
    isAiThinking,
    requestHint,
  ]);

  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current != null) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <section className="h-full bg-gray-950">
      <div className="h-full bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-200">Chat</p>
          <p className="text-xs text-gray-400 tabular-nums">
            Hints used: {hintsUsed}/{LIMITS.free.aiHintsPerSession}
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-800/60 bg-red-900/20 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">
          {hints.length === 0 ? (
            <div className="text-sm text-gray-500">
              Start drawing—short hints will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {hints
                .slice()
                .reverse()
                .map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => markHintRead(h.id)}
                    className={[
                      "w-full text-left rounded-xl border px-3 py-2 transition",
                      h.isRead
                        ? "bg-gray-950 border-gray-800 hover:bg-gray-950/80 text-gray-300"
                        : "bg-amber-900/20 border-amber-700/50 hover:bg-amber-900/25 text-amber-200",
                    ].join(" ")}
                    aria-label={h.isRead ? "Read hint" : "Unread hint"}
                  >
                    <div className="text-xs text-gray-400 tabular-nums">
                      Hint
                    </div>
                    <div className="text-sm leading-relaxed mt-1">
                      {h.content}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {canAskForHint && activePrompt && (
          <div className="shrink-0 mt-3">
            <button
              type="button"
              onClick={() => {
                // Cancel any pending inactivity-triggered request.
                if (inactivityTimeoutRef.current != null) {
                  window.clearTimeout(inactivityTimeoutRef.current);
                  inactivityTimeoutRef.current = null;
                }
                if (!activePrompt) return;
                if (!canvasRecords || canvasRecords.length === 0) return;
                const graph = parseCanvasToGraph(canvasRecords);
                if (graph.nodes.length === 0 && graph.edges.length === 0) return;
                void requestHint(graph);
              }}
              disabled={!canAskForHint || isAiThinking}
              className={[
                "w-full rounded-lg px-3 py-2 text-sm font-medium border transition-colors",
                "bg-gray-950 border-gray-800 text-gray-200 hover:bg-gray-800",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {isAiThinking ? "Asking..." : "Ask a question"}
            </button>
          </div>
        )}

        {!canAskForHint && (
          <div className="shrink-0 mt-3">
            <div className={amberUpgradeNudgeClasses}>
              {/* TODO: wire to billing page in Week 3 */}
              <div className="font-semibold mb-1">
                🔒 You&apos;ve used all {LIMITS.free.aiHintsPerSession} free hints
              </div>
              <div className="mb-3">
                Upgrade to Pro for unlimited AI questions
              </div>
              <button
                type="button"
                disabled
                className={disabledUpgradeButtonClasses}
              >
                Upgrade to Pro →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

