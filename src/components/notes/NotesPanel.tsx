"use client";

import { useSessionStore } from "@/store/session";

export function NotesPanel() {
  const notes = useSessionStore((s) => s.notes);
  const setNotes = useSessionStore((s) => s.setNotes);

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div
        className="flex shrink-0 items-center justify-between"
        style={{
          height: 44,
          padding: "0 16px",
          borderBottom: "1px solid var(--line-1)",
        }}
      >
        <span className="eyebrow">Notes</span>
        <span
          className="mono"
          style={{ fontSize: 10, color: "var(--text-5)" }}
        >
          assumptions · tradeoffs · risks
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scale assumptions, tradeoffs, open risks..."
          className="w-full h-full resize-none bg-transparent outline-none"
          style={{
            padding: 16,
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-2)",
            fontFamily: "var(--font-sans)",
          }}
        />
      </div>
    </div>
  );
}
