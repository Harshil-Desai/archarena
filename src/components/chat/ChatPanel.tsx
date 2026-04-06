"use client";

import { useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { useSessionStore } from "@/store/session";
import type { SemanticGraph } from "@/types";
import { LIMITS } from "@/lib/limits";
import { useCanvasValidation } from "../canvas/validation/useCanvasValidation";

interface ChatPanelProps {
  graph: SemanticGraph | null;
}

const amberUpgradeNudgeClasses =
  "bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 text-amber-200 text-sm";
const disabledUpgradeButtonClasses =
  "bg-amber-600 text-white px-3 py-1 rounded text-xs opacity-50 cursor-not-allowed w-full mt-2";

function getRelativeTime(timestamp: number) {
  const mins = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (mins === 0) return "Just now";
  return `${mins} min ago`;
}

export function ChatPanel({ graph }: ChatPanelProps) {
  const sessionId = useSessionStore((s) => s.sessionId);
  const activePrompt = useSessionStore((s) => s.activePrompt);
  const hintsUsed = useSessionStore((s) => s.hintsUsed);
  const isAiThinking = useSessionStore((s) => s.isAiThinking);
  const messages = useSessionStore((s) => s.messages);
  const setAiThinking = useSessionStore((s) => s.setAiThinking);
  const syncHintsFromServer = useSessionStore((s) => s.syncHintsFromServer);
  const addMessage = useSessionStore((s) => s.addMessage);
  const llmProvider = useSessionStore((s) => s.llmProvider);


  const bottomRef = useRef<HTMLDivElement>(null);

  const validation = useCanvasValidation(graph);
  
  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  const askHint = async () => {
    if (!sessionId) return;
    if (!validation.canRequestHint || isAiThinking) return;
    if (!activePrompt || !graph) return;
    if (hintsUsed >= LIMITS.free.aiHintsPerSession) return;

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

      if (!res.ok) {
        if (res.status === 403) {
          // limit reached — nudge already shows, nothing to do
          return;
        }
        throw new Error("Hint request failed");
      }

      const data = await res.json();

      if (typeof data.hintsUsed === "number") {
        syncHintsFromServer(data.hintsUsed);
      }

      const aiMessage = {
        id: nanoid(),
        role: "ai" as const,
        content: data.hint,
        timestamp: Date.now(),
        model: data.model, // return this from the API
      };
      
      addMessage(aiMessage);

      // Save updated chat history sequentially to DB after AI response
      const updatedMessages = [...messages, aiMessage];
      await fetch(`/api/session/${sessionId}/chat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory: updatedMessages }),
      }).catch(err => console.warn("Failed to persist hint chat history to DB:", err));
    } catch (err) {
      addMessage({
        id: nanoid(),
        role: "ai",
        content: "Something went wrong getting a hint. Try again.",
        timestamp: Date.now(),
      });
    } finally {
      setAiThinking(false);
    }
  };

  const hintsRemaining = LIMITS.free.aiHintsPerSession - hintsUsed;

  return (
    <section className="h-full bg-gray-950 flex flex-col pt-3">
      {/* 1. Header bar */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-800 shrink-0">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider font-[family-name:var(--font-display)]">
          AI Interviewer
        </h2>
        <div className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[11px] font-mono tracking-wide uppercase">
          {llmProvider === "anthropic" ? "claude haiku" : "gemini flash"}
        </div>
      </div>

      {/* 2. Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "ai" ? (
              <div className="max-w-[90%]">
                <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-100 leading-relaxed">
                  {m.content}
                </div>
                <div className="mt-1.5 flex items-center gap-2 px-1">
                  <span className="text-[10px] text-gray-500">
                    {getRelativeTime(m.timestamp)}
                  </span>
                  {m.model && (
                    <span className="bg-gray-800/60 text-gray-500 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide uppercase">
                      {m.model}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-[85%]">
                <div className="bg-blue-600 rounded-lg p-3 text-sm text-white leading-relaxed">
                  {m.content}
                </div>
                <div className="mt-1.5 px-1 text-right">
                  <span className="text-[10px] text-gray-500">
                    {getRelativeTime(m.timestamp)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 3. Hint button area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50 shrink-0">


        {hintsRemaining > 0 ? (
          <>
            {!validation.canRequestHint && (
              <p className="text-amber-400 text-xs mb-2">
                {validation.reason}
              </p>
            )}
            <button
              type="button"
              onClick={askHint}
              disabled={!validation.canRequestHint || isAiThinking || hintsUsed >= LIMITS.free.aiHintsPerSession}
              className={[
                "w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors shadow-sm",
                validation.canRequestHint && !isAiThinking
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed",
              ].join(" ")}
            >
              {isAiThinking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Thinking...
                </span>
              ) : (
                "Ask for a Hint →"
              )}
            </button>
            <div
              className={`text-center text-xs mt-2 ${
                hintsRemaining === 1 ? "text-amber-500 font-medium" : "text-gray-500"
              }`}
            >
              {hintsRemaining} hint{hintsRemaining === 1 ? "" : "s"} remaining
            </div>
          </>
        ) : (
          <div className={amberUpgradeNudgeClasses}>
            <div className="font-semibold mb-1">
              🔒 You&apos;ve used all {LIMITS.free.aiHintsPerSession} free hints
            </div>
            <div className="mb-3">Upgrade to Pro for unlimited AI questions</div>
            <button type="button" disabled className={disabledUpgradeButtonClasses}>
              Upgrade to Pro →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
