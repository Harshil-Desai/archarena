import { type DesignPrompt } from "@/lib/prompts"

// ─── Difficulty badge ──────────────────────────────────────────────────────

export function difficultyBadge(d: DesignPrompt["difficulty"]): {
  classes: string
  label: string
} {
  switch (d) {
    case "easy":
      return {
        classes: "bg-green-900/30 border border-green-700/50 text-green-300",
        label: "Easy",
      }
    case "medium":
      return {
        classes: "bg-amber-900/30 border border-amber-700/50 text-amber-300",
        label: "Medium",
      }
    case "hard":
      return {
        classes: "bg-red-900/30 border border-red-700/50 text-red-300",
        label: "Hard",
      }
  }
}

// ─── Score color ───────────────────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 75) return "text-green-400"
  if (score >= 50) return "text-amber-400"
  return "text-red-400"
}

// ─── Date formatting ───────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── scoreResult type guard ────────────────────────────────────────────────
// Prisma returns scoreResult as JsonValue (unknown at runtime).
// Use this guard before accessing .score — never cast without checking.

export function getScore(scoreResult: unknown): number | null {
  if (
    scoreResult !== null &&
    typeof scoreResult === "object" &&
    "score" in (scoreResult as object) &&
    typeof (scoreResult as { score: unknown }).score === "number"
  ) {
    return (scoreResult as { score: number }).score
  }
  return null
}
