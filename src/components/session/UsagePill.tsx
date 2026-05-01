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

  const tone = isExhausted
    ? "var(--danger)"
    : isLow
    ? "var(--gold)"
    : "var(--text-3)";

  const bg = isExhausted
    ? "color-mix(in oklch, var(--danger) 12%, transparent)"
    : isLow
    ? "color-mix(in oklch, var(--gold) 14%, transparent)"
    : "var(--bg-2)";

  const borderColor = isExhausted
    ? "color-mix(in oklch, var(--danger) 35%, transparent)"
    : isLow
    ? "color-mix(in oklch, var(--gold) 35%, transparent)"
    : "var(--line-2)";

  return (
    <div
      className="row gap-2"
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
        color: tone,
        background: bg,
        border: `1px solid ${borderColor}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: tone,
        }}
      />
      {isExhausted
        ? "No hints left"
        : `${remaining} hint${remaining === 1 ? "" : "s"} left`}
    </div>
  )
}
