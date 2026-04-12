"use client";

import { useSessionStore } from "@/store/session";

export function NotesPanel() {
  const notes = useSessionStore((s) => s.notes);
  const setNotes = useSessionStore((s) => s.setNotes);

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-800 px-4">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Notes
        </span>
        <span className="text-[10px] text-gray-600">
          Assumptions · tradeoffs · risks
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scale assumptions, tradeoffs, open risks..."
          className="w-full h-full resize-none bg-transparent p-4 text-sm text-gray-300 outline-none placeholder:text-gray-700"
        />
      </div>
    </div>
  );
}
