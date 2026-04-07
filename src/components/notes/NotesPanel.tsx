"use client";

import { useSessionStore } from "@/store/session";
import { useEffect, useRef } from "react";

export function NotesPanel() {
  const notes = useSessionStore((s) => s.notes);
  const setNotes = useSessionStore((s) => s.setNotes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    resize();
    textarea.addEventListener("input", resize);
    return () => textarea.removeEventListener("input", resize);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-2 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Working Notes
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write assumptions, capacity math, tradeoffs, and open risks."
          className="w-full h-full bg-transparent text-gray-200 text-sm outline-none resize-none placeholder:text-gray-600 leading-relaxed min-h-[120px]"
        />
      </div>
    </div>
  );
}
