"use client"

import { type HistorySession } from "@/types"
import { type DesignPrompt } from "@/lib/prompts"
import { difficultyBadge, scoreColor, formatDate, getScore } from "@/lib/utils"

interface SessionCardProps {
  session: HistorySession
  prompt: DesignPrompt | undefined
  onContinue: (session: HistorySession) => void
}

export function SessionCard({ session, prompt, onContinue }: SessionCardProps) {
  const badge = prompt ? difficultyBadge(prompt.difficulty) : null
  const score = getScore(session.scoreResult)

  return (
    <div className="group rounded-xl border border-gray-800/60 bg-gray-900/40 p-4 transition-colors hover:border-gray-700/80 hover:bg-gray-900/60">
      {/* Top row: title + difficulty badge */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-gray-100 leading-snug line-clamp-1">
          {prompt?.title ?? session.promptId}
        </h3>
        {badge && (
          <span
            className={[
              "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-wide",
              badge.classes,
            ].join(" ")}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Bottom row: score + date + continue button */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {score !== null ? (
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "font-[family-name:var(--font-display)] text-lg font-bold tabular-nums",
                  scoreColor(score),
                ].join(" ")}
              >
                {score}
              </span>
              <span className="text-xs text-gray-600">/100</span>
            </div>
          ) : (
            <span className="text-xs italic text-gray-500">Not scored</span>
          )}
          <span className="text-xs text-gray-500">{formatDate(session.updatedAt)}</span>
        </div>
        <button
          type="button"
          onClick={() => onContinue(session)}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
