"use client"

import { scoreColor } from "@/lib/utils"

interface StatsBarProps {
  total: number
  avg: number | null
  best: number | null
  loading?: boolean
}

function StatCell({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-[family-name:var(--font-display)] text-xs text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span
        className={[
          "font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums",
          valueClass ?? "text-gray-100",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  )
}

export function StatsBar({ total, avg, best, loading = false }: StatsBarProps) {
  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 rounded-xl border border-gray-800/60 bg-gray-900/40 px-5 py-4 animate-pulse">
        <div className="h-10 w-24 rounded bg-gray-800" />
        <div className="h-10 w-24 rounded bg-gray-800" />
        <div className="h-10 w-24 rounded bg-gray-800" />
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6 rounded-xl border border-gray-800/60 bg-gray-900/40 px-5 py-4">
      <StatCell label="Sessions" value={String(total)} />
      <div className="hidden sm:block h-8 w-px bg-gray-800" />
      <StatCell
        label="Avg Score"
        value={avg !== null ? `${avg}/100` : "---"}
        valueClass={avg !== null ? scoreColor(avg) : "text-gray-600"}
      />
      <div className="hidden sm:block h-8 w-px bg-gray-800" />
      <StatCell
        label="Best"
        value={best !== null ? `${best}/100` : "---"}
        valueClass={best !== null ? scoreColor(best) : "text-gray-600"}
      />
    </div>
  )
}
