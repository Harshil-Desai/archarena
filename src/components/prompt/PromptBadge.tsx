"use client";

import { useSessionStore } from "@/store/session";

function difficultyBadge(difficulty: "easy" | "medium" | "hard") {
  switch (difficulty) {
    case "easy":
      return "bg-green-900/30 border border-green-800/50 text-green-200";
    case "medium":
      return "bg-amber-900/30 border border-amber-800/50 text-amber-200";
    case "hard":
      return "bg-red-900/30 border border-red-800/50 text-red-200";
    default:
      return "bg-gray-900 border border-gray-800 text-gray-200";
  }
}

export function PromptBadge() {
  const activePrompt = useSessionStore((s) => s.activePrompt);

  if (!activePrompt) return null;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-100 truncate">
          {activePrompt.title}
        </p>
      </div>
      <span
        className={[
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
          difficultyBadge(activePrompt.difficulty),
          "tabular-nums",
        ].join(" ")}
      >
        {activePrompt.difficulty}
      </span>
    </div>
  );
}

