"use client";

import type { Hint } from "@/types";

interface HintBubbleProps {
  hint: Hint;
}

function getRelativeTime(timestamp: number) {
  const mins = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (mins === 0) return "now";
  return `${mins}m ago`;
}

export function HintBubble({ hint }: HintBubbleProps) {
  return (
    <div
      className="card-inset"
      style={{ padding: "10px 14px", borderColor: "color-mix(in oklch, var(--accent) 25%, var(--line-1))" }}
    >
      <div className="row gap-2" style={{ marginBottom: 4 }}>
        <span className="chip-dot" />
        <span className="eyebrow" style={{ color: "var(--accent)", fontSize: 9.5 }}>HINT</span>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-2)", margin: 0 }}>
        {hint.content}
      </p>
      <p
        className="mono"
        style={{ marginTop: 6, fontSize: 10, color: "var(--text-4)" }}
      >
        {getRelativeTime(hint.triggeredAt)}
      </p>
    </div>
  );
}
