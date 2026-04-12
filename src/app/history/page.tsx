"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { PROMPTS, type DesignPrompt } from "@/lib/prompts"
import { useSessionStore } from "@/store/session"

interface HistorySession {
  id: string
  promptId: string
  hintsUsed: number
  scoresUsed: number
  scoreResult: { score: number } | null
  status: "ACTIVE" | "SCORED" | "ABANDONED"
  createdAt: string
  updatedAt: string
}

type PageState = "loading" | "pro_required" | "error" | "ready"

function promptById(id: string): DesignPrompt | undefined {
  return PROMPTS.find((p) => p.id === id)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function difficultyBadge(d: DesignPrompt["difficulty"]): {
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

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-400"
  if (score >= 50) return "text-amber-400"
  return "text-red-400"
}

function statusBadge(status: HistorySession["status"]): {
  classes: string
  label: string
} {
  switch (status) {
    case "SCORED":
      return {
        classes: "bg-green-900/30 border border-green-700/50 text-green-300",
        label: "Scored",
      }
    case "ABANDONED":
      return {
        classes: "bg-gray-800/50 border border-gray-700/50 text-gray-500",
        label: "Abandoned",
      }
    default:
      return {
        classes: "bg-gray-800/50 border border-gray-700/50 text-gray-400",
        label: "Active",
      }
  }
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-48 rounded bg-gray-800" />
        <div className="h-4 w-16 rounded bg-gray-800" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-3 w-14 rounded bg-gray-800" />
        <div className="h-3 w-24 rounded bg-gray-800" />
        <div className="h-3 w-20 rounded bg-gray-800" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-gray-800" />
        <div className="h-8 w-20 rounded bg-gray-800" />
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const { status: authStatus } = useSession()
  const setActivePrompt = useSessionStore((s) => s.setActivePrompt)

  const [pageState, setPageState] = useState<PageState>("loading")
  const [sessions, setSessions] = useState<HistorySession[]>([])

  // Redirect unauthenticated users
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login?from=/history")
    }
  }, [authStatus, router])

  // Fetch history
  useEffect(() => {
    if (authStatus !== "authenticated") return

    let cancelled = false

    async function fetchHistory() {
      try {
        const res = await fetch("/api/history")

        if (!res.ok) {
          if (res.status === 403) {
            if (!cancelled) setPageState("pro_required")
            return
          }
          throw new Error("Failed to fetch")
        }

        const data = await res.json()
        if (!cancelled) {
          setSessions(data.sessions ?? [])
          setPageState("ready")
        }
      } catch {
        if (!cancelled) setPageState("error")
      }
    }

    fetchHistory()
    return () => { cancelled = true }
  }, [authStatus])

  const handleResume = (session: HistorySession) => {
    const prompt = promptById(session.promptId)
    if (prompt) setActivePrompt(prompt)
    router.push(`/session/${session.id}`)
  }

  // Auth loading
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (authStatus === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Home
            </Link>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
              Interview History
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
          >
            New session
          </button>
        </div>

        {/* Loading state */}
        {pageState === "loading" && (
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Pro required gate */}
        {pageState === "pro_required" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-amber-400"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm text-center">
              Session history is available on the Pro plan.
            </p>
            <Link
              href="/billing"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
            >
              View plans →
            </Link>
          </div>
        )}

        {/* Error state */}
        {pageState === "error" && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-gray-400 text-sm">
              Failed to load history. Try refreshing.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Empty state */}
        {pageState === "ready" && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-400 text-sm text-center">
              No sessions yet. Pick a question to get started.
            </p>
            <Link
              href="/"
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors px-4 py-2 rounded-lg border border-blue-500/30 hover:border-blue-500/50"
            >
              Browse questions →
            </Link>
          </div>
        )}

        {/* Session list */}
        {pageState === "ready" && sessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => {
              const prompt = promptById(s.promptId)
              const badge = prompt
                ? difficultyBadge(prompt.difficulty)
                : null
              const sBadge = statusBadge(s.status)

              return (
                <div
                  key={s.id}
                  className="group rounded-xl border border-gray-800/60 bg-gray-900/40 p-5 transition-colors hover:border-gray-700/80 hover:bg-gray-900/60"
                >
                  {/* Top row: title + status */}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-gray-100 leading-snug">
                      {prompt?.title ?? s.promptId}
                    </h3>
                    <span
                      className={[
                        "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-wide",
                        sBadge.classes,
                      ].join(" ")}
                    >
                      {sBadge.label}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {badge && (
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-wide",
                          badge.classes,
                        ].join(" ")}
                      >
                        {badge.label}
                      </span>
                    )}
                    <span>{formatDate(s.updatedAt)}</span>
                    <span className="text-gray-600">·</span>
                    <span>{s.hintsUsed} hint{s.hintsUsed !== 1 ? "s" : ""} used</span>
                  </div>

                  {/* Bottom row: score + resume */}
                  <div className="mt-4 flex items-center justify-between">
                    {s.scoreResult && typeof s.scoreResult === "object" && "score" in s.scoreResult ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "font-[family-name:var(--font-display)] text-lg font-bold tabular-nums",
                            scoreColor((s.scoreResult as { score: number }).score),
                          ].join(" ")}
                        >
                          {(s.scoreResult as { score: number }).score}
                        </span>
                        <span className="text-xs text-gray-600">/100</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">Not scored</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleResume(s)}
                      className="text-xs font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Resume →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
