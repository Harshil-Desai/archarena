"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/session";

function formatMMSS(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionTimer() {
  const secondsElapsed = useSessionStore((s) => s.secondsElapsed);
  const isRunning = useSessionStore((s) => s.isRunning);
  const startTimer = useSessionStore((s) => s.startTimer);
  const tickTimer = useSessionStore((s) => s.tickTimer);
  const activePrompt = useSessionStore((s) => s.activePrompt);

  const timeLimitExceeded =
    activePrompt != null && secondsElapsed > activePrompt.timeLimit;

  useEffect(() => {
    startTimer();
    const id = window.setInterval(() => tickTimer(), 1000);
    return () => window.clearInterval(id);
  }, [startTimer, tickTimer]);

  return (
    <div
      aria-live="polite"
      className="row gap-3"
      style={{
        padding: "8px 16px",
        borderRadius: 10,
        border: "1px solid var(--line-2)",
        background: "var(--bg-2)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: isRunning ? "var(--win)" : "var(--text-5)",
          boxShadow: isRunning
            ? "0 0 12px color-mix(in oklch, var(--win) 60%, transparent)"
            : "none",
          animation: isRunning ? "blink 1.6s step-end infinite" : "none",
          flexShrink: 0,
        }}
      />
      <span
        className="mono"
        style={{
          fontSize: 20,
          letterSpacing: "0.04em",
          color: timeLimitExceeded ? "var(--danger)" : "var(--text-1)",
        }}
      >
        {formatMMSS(secondsElapsed)}
      </span>
      {activePrompt && (
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--text-4)" }}
        >
          / {formatMMSS(activePrompt.timeLimit)}
        </span>
      )}
    </div>
  );
}

