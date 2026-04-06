"use client"
import { useSessionStore } from "@/store/session"
import { LIMITS } from "@/lib/limits"
import { useSession } from "next-auth/react"

export function UsagePill() {
  const { hintsUsed } = useSessionStore()
  const { data: authSession } = useSession()
  const tier = authSession?.user?.tier ?? "FREE"
  const maxHints = tier === "FREE" 
    ? LIMITS.free.aiHintsPerSession 
    : Infinity

  if (maxHints === Infinity) return null

  const remaining = maxHints - hintsUsed
  const isExhausted = remaining <= 0
  const isLow = remaining === 1

  return (
    <div className={`
      flex items-center gap-1.5 px-2.5 py-1 rounded-full 
      text-xs font-medium border transition-colors
      ${isExhausted 
        ? "bg-red-900/30 border-red-800/50 text-red-400" 
        : isLow 
          ? "bg-amber-900/30 border-amber-800/50 text-amber-400"
          : "bg-gray-800 border-gray-700 text-gray-400"
      }
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isExhausted ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-gray-500"
      }`} />
      {isExhausted
        ? "No hints left"
        : `${remaining} hint${remaining === 1 ? "" : "s"} left`
      }
    </div>
  )
}
