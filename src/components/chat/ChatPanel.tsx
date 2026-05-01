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

const upgradeNudgeStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: 14,
  fontSize: 13,
  background: "color-mix(in oklch, var(--gold) 12%, transparent)",
  border: "1px solid color-mix(in oklch, var(--gold) 35%, transparent)",
  color: "var(--text-1)",
};

const upgradeLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  marginTop: 10,
  padding: "8px 12px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  background: "var(--gold)",
  color: "#1a1a1a",
  textDecoration: "none",
  transition: "opacity .15s",
};

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

        if (errorData?.error === "daily_limit_reached") {
          addHint({
            id: nanoid(),
            content: "You've reached the daily hint limit. Come back tomorrow, or upgrade to Pro for a higher daily limit.",
            triggeredAt: Date.now(),
            isRead: false,
          })
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
      <div
        className="flex shrink-0 items-center justify-between"
        style={{
          height: 44,
          padding: "0 16px",
          borderBottom: "1px solid var(--line-1)",
        }}
      >
        <span className="eyebrow">Interviewer</span>
        <span
          className="mono"
          style={{
            padding: "3px 8px",
            borderRadius: 999,
            fontSize: 9.5,
            background: "var(--bg-2)",
            border: "1px solid var(--line-1)",
            color: "var(--text-4)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {llmProvider === "anthropic" ? "Claude Haiku" : "Gemini Flash"}
        </span>
      </div>

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && hints.length === 0 ? (
          <div
            style={{
              borderRadius: 12,
              border: "1px dashed var(--line-2)",
              padding: 16,
              fontSize: 13,
              lineHeight: 1.55,
              color: "var(--text-3)",
              background: "color-mix(in oklch, var(--bg-2) 50%, transparent)",
            }}
          >
            Request a hint when you want the interviewer to push on bottlenecks,
            tradeoffs, and weak spots in the current diagram.
          </div>
        ) : null}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {hints.length > 0 && (
          <div className="card-inset" style={{ padding: 12 }}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <span className="eyebrow">Interviewer hints</span>
              <span
                className="mono"
                style={{ fontSize: 10, color: "var(--text-5)" }}
              >
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

      <div
        className="shrink-0"
        style={{
          padding: 16,
          borderTop: "1px solid var(--line-1)",
          background: "color-mix(in oklch, var(--bg-1) 40%, transparent)",
        }}
      >
        {hintError && (
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11.5,
              color: "var(--gold)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {hintError}
          </p>
        )}
        {!validation.canRequestHint && hintsRemaining > 0 && (
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11.5,
              color: "var(--gold)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {validation.reason}
          </p>
        )}

        <div>
          {hintsRemaining > 0 ? (
            <>
              <button
                type="button"
                onClick={askHint}
                disabled={
                  !validation.canRequestHint ||
                  isAiThinking ||
                  hintsUsed >= LIMITS.free.aiHintsPerSession
                }
                className={
                  validation.canRequestHint && !isAiThinking
                    ? "btn btn-primary"
                    : "btn btn-soft"
                }
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  fontSize: 13,
                  cursor:
                    !validation.canRequestHint || isAiThinking
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !validation.canRequestHint || isAiThinking ? 0.7 : 1,
                }}
              >
                {isAiThinking ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="animate-spin"
                      style={{
                        height: 14,
                        width: 14,
                        borderRadius: "50%",
                        border: "2px solid color-mix(in oklch, var(--text-1) 20%, transparent)",
                        borderTopColor: "var(--text-1)",
                      }}
                    />
                    Reviewing…
                  </span>
                ) : (
                  "Ask for a hint"
                )}
              </button>
              <div
                className="mono"
                style={{
                  marginTop: 8,
                  textAlign: "center",
                  fontSize: 11,
                  color: hintsRemaining === 1 ? "var(--gold)" : "var(--text-4)",
                  fontWeight: hintsRemaining === 1 ? 500 : 400,
                  letterSpacing: "0.04em",
                }}
              >
                {hintsRemaining} hint{hintsRemaining === 1 ? "" : "s"} remaining
              </div>
            </>
          ) : (
            <div style={upgradeNudgeStyle}>
              <div
                style={{
                  marginBottom: 4,
                  fontWeight: 500,
                  color: "var(--text-1)",
                }}
              >
                Free plan has no hints left.
              </div>
              <div style={{ marginBottom: 4, color: "var(--text-3)", fontSize: 12.5 }}>
                Upgrade if you want unlimited interviewer hints.
              </div>
              <a href="/billing" style={upgradeLinkStyle}>
                Upgrade to Pro →
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
