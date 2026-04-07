"use client";

import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session";
import { LIMITS } from "@/lib/limits";
import { PROMPTS, type DesignPrompt } from "@/lib/prompts";

const FREE_PROMPT_COUNT = LIMITS.free.promptCount;

function timeLimitMinutes(timeLimitSeconds: number) {
  return Math.ceil(timeLimitSeconds / 60);
}

function difficultyTone(difficulty: DesignPrompt["difficulty"]): {
  badge: string;
} {
  switch (difficulty) {
    case "easy":
      return {
        badge: "bg-green-900/30 border border-green-800/50 text-green-200",
      };
    case "medium":
      return {
        badge: "bg-amber-900/30 border border-amber-800/50 text-amber-200",
      };
    case "hard":
      return {
        badge: "bg-red-900/30 border border-red-800/50 text-red-200",
      };
    default:
      return {
        badge: "bg-gray-900 border border-gray-800 text-gray-200",
      };
  }
}

export function PromptSelector() {
  const router = useRouter();
  const setActivePrompt = useSessionStore((s) => s.setActivePrompt);

  return (
    <section className="bg-gray-950">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROMPTS.map((prompt, idx) => {
          const isUnlocked = idx < FREE_PROMPT_COUNT;
          const tones = difficultyTone(prompt.difficulty);
          const minutes = timeLimitMinutes(prompt.timeLimit);

          return (
            <button
              key={prompt.id}
              type="button"
              disabled={!isUnlocked}
              onClick={() => {
                if (!isUnlocked) return;
                setActivePrompt(prompt);
                router.push(`/session/${nanoid(8)}`);
              }}
              className={[
                "relative text-left p-4 rounded-xl border transition-colors",
                "bg-gray-900 border-gray-800",
                isUnlocked
                  ? "hover:bg-gray-800"
                  : "opacity-60 cursor-not-allowed pointer-events-none",
              ].join(" ")}
              aria-disabled={!isUnlocked}
              title={!isUnlocked ? "Available on Pro plan" : undefined}
            >
              {!isUnlocked && (
                <span
                  className="absolute top-3 right-3 px-2 py-1 text-[11px] font-semibold rounded-full bg-amber-600/20 border border-amber-500/40 text-amber-200"
                >
                  Pro
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-gray-100 font-semibold truncate">
                    {prompt.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {prompt.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={[
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                    tones.badge,
                  ].join(" ")}
                >
                  {prompt.difficulty}
                </span>

                <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
                  {minutes} min
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

