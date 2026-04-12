"use client";

import { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useSessionStore } from "@/store/session";
import type { SemanticGraph } from "@/types";
import { LIMITS } from "@/lib/limits";
import { useCanvasValidation } from "../canvas/validation/useCanvasValidation";
import { ChatMessage } from "./ChatMessage";
import { HintBubble } from "./HintBubble";

interface ChatPanelProps {
  graph: SemanticGraph | null;
}

const amberUpgradeHintClasses =
  "bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 text-amber-200 text-sm";
const upgradeLinkClasses =
  "bg-amber-600 text-white px-3 py-1 rounded text-xs w-full mt-2 hover:opacity-90 transition-opacity";

export function ChatPanel({ graph }: ChatPanelProps) {
  const sessionId = useSessionStore((s) => s.sessionId);
  const activePrompt = useSessionStore((s) => s.activePrompt);
  const hints = useSessionStore((s) => s.hints);
  const hintsUsed = useSessionStore((s) => s.hintsUsed);
  const isAiThinking = useSessionStore((s) => s.isAiThinking);
  const messages = useSessionStore((s) => s.messages);
  const setAiThinking = useSessionStore((s) => s.setAiThinking);
  const addHint = useSessionStore((s) => s.addHint);
  const markAllHintsRead = useSessionStore((s) => s.markAllHintsRead);
  const syncHintsFromServer = useSessionStore((s) => s.syncHintsFromServer);
  const llmProvider = useSessionStore((s) => s.llmProvider);

  const bottomRef = useRef<HTMLDivElement>(null);
  const [hintError, setHintError] = useState<string | null>(null);

  const validation = useCanvasValidation(graph);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking, hints]);

  useEffect(() => {
    if (hints.length > 0) {
      markAllHintsRead();
    }
  }, [hints, markAllHintsRead]);

  const askHint = async () => {
    if (!sessionId) return;
    if (!validation.canRequestHint || isAiThinking) return;
    if (!activePrompt || !graph) return;
    if (hintsUsed >= LIMITS.free.aiHintsPerSession) return;

    setHintError(null);
    setAiThinking(true);

    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          graph,
          history: messages,
          llmProvider,
        }),
      });

      const errorData = !res.ok
        ? await res.json().catch(() => ({}))
        : null;

      if (!res.ok) {
        if (res.status === 403 && errorData?.error === "free_limit_reached") {
          syncHintsFromServer(
            typeof errorData.hintsUsed === "number"
              ? errorData.hintsUsed
              : LIMITS.free.aiHintsPerSession
          );
          setHintError("Free plan is out of hints. Upgrade for more.");
          return;
        }

        if (typeof errorData?.hintsUsed === "number") {
          syncHintsFromServer(errorData.hintsUsed);
        }

        throw new Error(errorData?.message ?? "Hint request failed");
      }

      const data = await res.json();

      if (typeof data.hintsUsed === "number") {
        syncHintsFromServer(data.hintsUsed);
      }

      addHint({
        id: nanoid(),
        content: data.hint.trim(),
        triggeredAt: Date.now(),
        isRead: false,
      });
    } catch (err) {
      setHintError(
        err instanceof Error
          ? err.message
          : "Could not get a hint. Try again."
      );
    } finally {
      setAiThinking(false);
    }
  };

  const hintsRemaining = LIMITS.free.aiHintsPerSession - hintsUsed;

  return (
    <section className="flex h-full min-h-0 flex-col bg-transparent">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-800 px-4">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Interviewer
        </span>
        <div className="rounded-full bg-gray-800 px-2 py-0.5 font-mono text-[10px] text-gray-500">
          {llmProvider === "anthropic" ? "CLAUDE HAIKU" : "GEMINI FLASH"}
        </div>
      </div>

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && hints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 bg-gray-950/40 p-4 text-sm text-gray-400">
            Request a hint when you want the interviewer to push on bottlenecks,
            tradeoffs, and weak spots in the current diagram.
          </div>
        ) : null}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {hints.length > 0 && (
          <div className="rounded-lg border border-gray-800 bg-gray-950/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Interviewer hints
              </p>
              <span className="text-[10px] text-gray-600">
                {hints.length} total
              </span>
            </div>
            <div className="space-y-2">
              {[...hints].reverse().map((hint) => (
                <HintBubble key={hint.id} hint={hint} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-gray-800 bg-gray-900/30 p-4">
        {hintError && (
          <p className="mb-2 text-xs text-amber-400">{hintError}</p>
        )}
        {!validation.canRequestHint && hintsRemaining > 0 && (
          <p className="mb-2 text-xs text-amber-400">
            {validation.reason}
          </p>
        )}

        <div className="mt-3">
          {hintsRemaining > 0 ? (
            <>
              <button
                type="button"
                onClick={askHint}
                disabled={!validation.canRequestHint || isAiThinking || hintsUsed >= LIMITS.free.aiHintsPerSession}
                className={[
                  "w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors shadow-sm",
                  validation.canRequestHint && !isAiThinking
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "cursor-not-allowed bg-gray-800 text-gray-500",
                ].join(" ")}
              >
                {isAiThinking ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Reviewing...
                  </span>
                ) : (
                  "Ask for a hint"
                )}
              </button>
              <div
                className={`mt-2 text-center text-xs ${
                  hintsRemaining === 1 ? "font-medium text-amber-500" : "text-gray-500"
                }`}
              >
                {hintsRemaining} hint{hintsRemaining === 1 ? "" : "s"} remaining
              </div>
            </>
          ) : (
            <div className={amberUpgradeHintClasses}>
              <div className="mb-1 font-semibold">
                Free plan has no hints left.
              </div>
              <div className="mb-3">Upgrade if you want unlimited interviewer hints.</div>
              <a href="/billing" className={upgradeLinkClasses}>
                Upgrade to Pro →
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
