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
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
      <p className="text-sm leading-relaxed text-gray-200">
        {hint.content}
      </p>
      <p className="mt-1 text-[10px] text-gray-500">
        {getRelativeTime(hint.triggeredAt)}
      </p>
    </div>
  );
}
