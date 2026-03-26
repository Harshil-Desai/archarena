"use client";

import { useSessionStore } from "@/store/session";

export function NotesPanel() {
  const notes = useSessionStore((s) => s.notes);
  const setNotes = useSessionStore((s) => s.setNotes);

  return (
    <section className="h-full bg-gray-950">
      <div className="h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-200">Notes</span>
          <span className="text-xs text-gray-400 tabular-nums">
            {notes.length} chars
          </span>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down assumptions, trade-offs, rough calculations..."
          className="flex-1 w-full bg-gray-950 text-gray-100 px-4 py-3 font-mono text-sm outline-none placeholder:text-gray-500 resize-none"
        />
      </div>
    </section>
  );
}

