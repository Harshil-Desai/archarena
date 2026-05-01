"use client";

import { useSessionStore } from "@/store/session";

function difficultyChipClass(difficulty: "easy" | "medium" | "hard") {
  switch (difficulty) {
    case "easy":
      return "chip chip-easy";
    case "medium":
      return "chip chip-med";
    case "hard":
      return "chip chip-hard";
    default:
      return "chip";
  }
}

export function PromptBadge() {
  const activePrompt = useSessionStore((s) => s.activePrompt);

  if (!activePrompt) return null;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className={difficultyChipClass(activePrompt.difficulty)}
        style={{ flexShrink: 0 }}
      >
        {activePrompt.difficulty}
      </span>
      <span
        className="serif truncate"
        style={{
          fontSize: 16,
          color: "var(--text-1)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        {activePrompt.title}
      </span>
    </div>
  );
}

