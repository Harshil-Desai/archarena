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
    <div className="bg-gray-950">
      <div
        className="border border-gray-800 bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3"
        aria-live="polite"
      >
        <span
          className={
            isRunning
              ? "w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_14px_rgba(34,197,94,0.7)]"
              : "w-2.5 h-2.5 rounded-full bg-gray-800"
          }
        />
        <span
          className={[
            "font-mono text-2xl tabular-nums",
            timeLimitExceeded ? "text-red-400" : "text-gray-100",
          ].join(" ")}
        >
          {formatMMSS(secondsElapsed)}
        </span>
      </div>
    </div>
  );
}

