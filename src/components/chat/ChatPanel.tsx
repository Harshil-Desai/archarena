"use client";

import { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useSessionStore } from "@/store/session";
import type { SemanticGraph } from "@/types";
import { LIMITS } from "@/lib/limits";
import { useCanvasValidation } from "../canvas/validation/useCanvasValidation";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { HintBubble } from "./HintBubble";

interface ChatPanelProps {
  graph: SemanticGraph | null;
}

const EMPTY_GRAPH: SemanticGraph = {
  nodes: [],
  edges: [],
  annotations: [],
  unlabeledEdgeCount: 0,
  unlabeledGenericCount: 0,
  isValid: true,
};

const amberUpgradeNudgeClasses =
  "bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 text-amber-200 text-sm";
const upgradeLinkClasses =
  "bg-amber-600 text-white px-3 py-1 rounded text-xs w-full mt-2 hover:opacity-90 transition-opacity";

export function ChatPanel({ graph }: ChatPanelProps) {
  const sessionId = useSessionStore((s) => s.sessionId);
  const activePrompt = useSessionStore((s) => s.activePrompt);
  const hints = useSessionStore((s) => s.hints);
  const hintsUsed = useSessionStore((s) => s.hintsUsed);
  const unreadHintCount = useSessionStore((s) => s.unreadHintCount);
  const isAiThinking = useSessionStore((s) => s.isAiThinking);
  const messages = useSessionStore((s) => s.messages);
  const setAiThinking = useSessionStore((s) => s.setAiThinking);
  const addHint = useSessionStore((s) => s.addHint);
  const addMessage = useSessionStore((s) => s.addMessage);
  const updateLastMessage = useSessionStore((s) => s.updateLastMessage);
  const markAllHintsRead = useSessionStore((s) => s.markAllHintsRead);
  const incrementHintsUsed = useSessionStore((s) => s.incrementHintsUsed);
  const syncHintsFromServer = useSessionStore((s) => s.syncHintsFromServer);
  const llmProvider = useSessionStore((s) => s.llmProvider);

  const bottomRef = useRef<HTMLDivElement>(null);
  const [showHints, setShowHints] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const validation = useCanvasValidation(graph);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking, showHints]);

  useEffect(() => {
    if (showHints && unreadHintCount > 0) {
      markAllHintsRead();
    }
  }, [markAllHintsRead, showHints, unreadHintCount]);

  const askHint = async () => {
    if (!sessionId) return;
    if (!validation.canRequestHint || isAiThinking) return;
    if (!activePrompt || !graph) return;
    if (hintsUsed >= LIMITS.free.aiHintsPerSession) return;

    setHintError(null);
    setChatError(null);
    setAiThinking(true);
    incrementHintsUsed();

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
          setHintError("Free plan is out of nudges. Upgrade for more.");
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
      setShowHints(true);
    } catch (err) {
      setHintError(
        err instanceof Error
          ? err.message
          : "Could not get a nudge. Try again."
      );
    } finally {
      setAiThinking(false);
    }
  };

  const sendChatMessage = async () => {
    if (!sessionId || isAiThinking) return;

    const content = draft.trim();
    if (!content) return;

    setDraft("");
    setHintError(null);
    setChatError(null);
    setAiThinking(true);

    const userMessage = {
      id: nanoid(),
      role: "user" as const,
      content,
      timestamp: Date.now(),
    };

    const pendingAssistantMessage = {
      id: nanoid(),
      role: "ai" as const,
      content: "Thinking...",
      timestamp: Date.now(),
      model: llmProvider === "gemini" ? "flash" as const : "haiku" as const,
    };

    addMessage(userMessage);
    addMessage(pendingAssistantMessage);

    try {
      const res = await fetch(`/api/session/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          graph: graph ?? EMPTY_GRAPH,
          llmProvider,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message ?? "Chat request failed");
      }

      const authoritativeHistory = Array.isArray(data.chatHistory)
        ? data.chatHistory
        : typeof data.reply === "string"
          ? [
              ...messages,
              userMessage,
              {
                ...pendingAssistantMessage,
                content: data.reply.trim(),
              },
            ]
          : null;

      if (!authoritativeHistory) {
        throw new Error("The AI returned an invalid chat response.");
      }

      useSessionStore.setState({ messages: authoritativeHistory });

      const persistRes = await fetch(`/api/session/${sessionId}/chat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: authoritativeHistory,
        }),
      });

      if (!persistRes.ok) {
        throw new Error("Reply generated, but chat history failed to save.");
      }

    } catch (err) {
      const fallbackMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong sending your message. Try again.";

      updateLastMessage(fallbackMessage);
      setChatError(fallbackMessage);
    } finally {
      setAiThinking(false);
    }
  };

  const hintsRemaining = LIMITS.free.aiHintsPerSession - hintsUsed;

  return (
    <section className="flex h-full flex-col bg-gray-950 pt-3">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-800 px-4 pb-3">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wider text-gray-200">
          Interviewer
        </h2>
        <div className="flex items-center gap-2">
          {hints.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHints((current) => !current)}
              className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[11px] text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100"
            >
              Nudges {hints.length}
              {unreadHintCount > 0 && (
                <span className="ml-1 text-amber-400">({unreadHintCount} new)</span>
              )}
            </button>
          )}
          <div className="rounded bg-gray-800 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-gray-400">
            {llmProvider === "anthropic" ? "claude haiku" : "gemini flash"}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 bg-gray-950/40 p-4 text-sm text-gray-400">
            Ask about weak spots, capacity limits, retries, or tradeoffs in the diagram on the board.
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-gray-800 bg-gray-900/50 p-4">
        {showHints && hints.length > 0 && (
          <div className="mb-3 rounded-lg border border-gray-800 bg-gray-950/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Interviewer nudges
              </p>
              <button
                type="button"
                onClick={() => setShowHints(false)}
                className="text-[11px] text-gray-500 hover:text-gray-300"
              >
                Hide
              </button>
            </div>
            <div className="space-y-2">
              {[...hints].reverse().map((hint) => (
                <HintBubble key={hint.id} hint={hint} />
              ))}
            </div>
          </div>
        )}

        {chatError && (
          <p className="mb-2 text-xs text-red-400">{chatError}</p>
        )}
        {hintError && (
          <p className="mb-2 text-xs text-amber-400">{hintError}</p>
        )}

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={sendChatMessage}
          disabled={isAiThinking}
        />

        <div className="mt-3">
          {hintsRemaining > 0 ? (
            <>
              {!validation.canRequestHint && (
                <p className="mb-2 text-xs text-amber-400">
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
                  "Ask for a nudge"
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
            <div className={amberUpgradeNudgeClasses}>
              <div className="mb-1 font-semibold">
                Free plan has no nudges left.
              </div>
              <div className="mb-3">Upgrade if you want unlimited interviewer nudges.</div>
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
