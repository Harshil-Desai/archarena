interface ProBadgeProps {
  size?: "sm" | "xs"
  className?: string
}

export function ProBadge({ size = "sm", className = "" }: ProBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium font-mono
        text-amber-400 bg-amber-900/30 border border-amber-800/50
        rounded-full
        ${size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"}
        ${className}
      `}
    >
      PRO
    </span>
  )
}
