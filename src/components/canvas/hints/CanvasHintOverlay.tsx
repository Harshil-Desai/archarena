"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sysdraw-canvas-hint-seen";

export function CanvasHintOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage not available — skip hint
    }
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handler = () => dismiss();
    // Dismiss on any click after a short delay (so it doesn't dismiss on mount click)
    const timer = setTimeout(() => {
      document.addEventListener("click", handler, { once: true });
    }, 500);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      className="absolute left-20 top-1/2 -translate-y-1/2 z-50
                 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3
                 shadow-lg shadow-black/40 max-w-[260px]
                 animate-in fade-in duration-300"
    >
      <p className="text-white text-xs leading-relaxed mb-1.5">
        ← Use the toolbar to add components and arrows
      </p>
      <p className="text-gray-400 text-xs leading-relaxed mb-1.5">
        Double-click any shape to label it
      </p>
      <p className="text-gray-400 text-xs leading-relaxed">
        Arrow tool: click shape edges to connect them
      </p>
      <p className="text-gray-500 text-[10px] mt-2">Click anywhere to dismiss</p>
    </div>
  );
}
