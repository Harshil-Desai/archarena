"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { PROMPTS, FREE_PROMPT_COUNT, type DesignPrompt } from "@/lib/prompts"
import { useSessionStore } from "@/store/session"
import { type HistorySession } from "@/types"
import { difficultyBadge, getScore } from "@/lib/utils"
import { StatsBar } from "@/components/dashboard/StatsBar"
import { SessionCard } from "@/components/dashboard/SessionCard"

type PageState = "loading" | "error" | "ready"

function computeStats(sessions: HistorySession[]) {
  const scored = sessions
    .map((s) => getScore(s.scoreResult))
    .filter((n): n is number => n !== null)
  return {
    total: sessions.length,
    avg: scored.length
      ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
      : null,
    best: scored.length ? Math.max(...scored) : null,
  }
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-48 rounded bg-gray-800" />
        <div className="h-4 w-16 rounded bg-gray-800" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-3 w-14 rounded bg-gray-800" />
        <div className="h-3 w-24 rounded bg-gray-800" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()
  const setActivePrompt = useSessionStore((s) => s.setActivePrompt)

  const [pageState, setPageState] = useState<PageState>("loading")
  const [sessions, setSessions] = useState<HistorySession[]>([])
  const [startingPromptId, setStartingPromptId] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login?from=/dashboard")
    }
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus !== "authenticated") return

    let cancelled = false

    async function fetchHistory() {
      try {
        const res = await fetch("/api/history")
        if (!res.ok) {
          if (!cancelled) setPageState("error")
          return
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

  const handleContinue = (session: HistorySession) => {
    const prompt = PROMPTS.find((p) => p.id === session.promptId)
    if (prompt) setActivePrompt(prompt)
    router.push(`/session/${session.id}`)
  }

  const currentTier = (authSession?.user as { tier?: string } | undefined)?.tier ?? "FREE"

  const handlePromptClick = async (prompt: DesignPrompt, index: number) => {
    if (currentTier === "FREE" && index >= FREE_PROMPT_COUNT) {
      router.push("/billing")
      return
    }
    setStartingPromptId(prompt.id)
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id }),
      })
      if (!res.ok) {
        setStartingPromptId(null)
        return
      }
      const { sessionId } = await res.json()
      setActivePrompt(prompt)
      router.push(`/session/${sessionId}`)
    } catch {
      setStartingPromptId(null)
    }
  }

  const stats = computeStats(sessions)
  const visibleSessions = sessions.slice(0, 10)

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            Dashboard
          </h1>
        </div>

        <StatsBar
          total={stats.total}
          avg={stats.avg}
          best={stats.best}
          loading={pageState === "loading"}
        />

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-gray-100 mb-4">
            Past Sessions
          </h2>

          {pageState === "loading" && (
            <div className="flex flex-col gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {pageState === "error" && (
            <p className="text-sm text-gray-400">
              Couldn&apos;t load your sessions. Check your connection and refresh the page.
            </p>
          )}

          {pageState === "ready" && sessions.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <p className="text-base font-semibold text-gray-300">No interviews yet</p>
              <p className="text-sm text-gray-500">
                Pick a system design question below to start your first practice session.
              </p>
            </div>
          )}

          {pageState === "ready" && sessions.length > 0 && (
            <div className="flex flex-col gap-3">
              {visibleSessions.map((s) => {
                const prompt = PROMPTS.find((p) => p.id === s.promptId)
                return (
                  <SessionCard
                    key={s.id}
                    session={s}
                    prompt={prompt}
                    onContinue={handleContinue}
                  />
                )
              })}
              {sessions.length > 10 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  Showing 10 of {sessions.length} sessions
                </p>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-gray-100 mb-4">
            Start a New Interview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROMPTS.map((prompt, index) => {
              const badge = difficultyBadge(prompt.difficulty)
              const isLocked = currentTier === "FREE" && index >= FREE_PROMPT_COUNT
              const isStarting = startingPromptId === prompt.id

              return (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => handlePromptClick(prompt, index)}
                  disabled={isStarting}
                  className={[
                    "text-left rounded-2xl border border-gray-800/60 bg-gray-950/40 backdrop-blur-md p-5 transition-all",
                    isLocked
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-gray-700/80 hover:bg-gray-900/60 cursor-pointer",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-wide",
                        badge.classes,
                      ].join(" ")}
                    >
                      {badge.label}
                    </span>
                    {isLocked && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4 text-gray-600 shrink-0"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-gray-100 leading-snug mb-1">
                    {prompt.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{prompt.description}</p>
                  {!isLocked && (
                    <div className="mt-4">
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
                          isStarting
                            ? "bg-blue-600/50 cursor-wait"
                            : "bg-blue-600 hover:bg-blue-500",
                        ].join(" ")}
                      >
                        {isStarting ? (
                          <>
                            <span className="h-3 w-3 border border-white/40 border-t-white rounded-full animate-spin" />
                            Starting…
                          </>
                        ) : (
                          "Start Interview"
                        )}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
