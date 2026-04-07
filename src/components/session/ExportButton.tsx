"use client";

import { useMemo, useState } from "react";
import { useSessionStore } from "@/store/session";
import type { SemanticGraph } from "@/types";

interface ExportButtonProps {
  sessionId: string | null;
  graph: SemanticGraph | null;
}

function sanitizeFilePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ExportButton({ sessionId, graph }: ExportButtonProps) {
  const activePrompt = useSessionStore((s) => s.activePrompt);
  const notes = useSessionStore((s) => s.notes);
  const hints = useSessionStore((s) => s.hints);
  const messages = useSessionStore((s) => s.messages);
  const scoreResult = useSessionStore((s) => s.scoreResult);
  const hintsUsed = useSessionStore((s) => s.hintsUsed);
  const scoresUsed = useSessionStore((s) => s.scoresUsed);
  const secondsElapsed = useSessionStore((s) => s.secondsElapsed);
  const [status, setStatus] = useState<"idle" | "done">("idle");

  const canExport = Boolean(
    sessionId &&
      (graph ||
        notes.trim().length > 0 ||
        hints.length > 0 ||
        messages.length > 0 ||
        scoreResult)
  );

  const payload = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      sessionId,
      prompt: activePrompt
        ? {
            id: activePrompt.id,
            title: activePrompt.title,
            description: activePrompt.description,
            difficulty: activePrompt.difficulty,
          }
        : null,
      elapsedSeconds: secondsElapsed,
      usage: {
        hintsUsed,
        scoresUsed,
      },
      graph,
      notes,
      hints,
      chatHistory: messages,
      scoreResult,
    }),
    [
      activePrompt,
      graph,
      hints,
      hintsUsed,
      messages,
      notes,
      scoreResult,
      scoresUsed,
      secondsElapsed,
      sessionId,
    ]
  );

  const handleExport = () => {
    if (!canExport || !sessionId) return;

    const promptSlug = sanitizeFilePart(activePrompt?.title ?? "session");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${promptSlug}-${timestamp}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
    setStatus("done");
    window.setTimeout(() => setStatus("idle"), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!canExport}
      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:border-gray-800 disabled:bg-gray-950 disabled:text-gray-600"
      title={canExport ? "Download the current session as JSON" : "Nothing to export yet"}
    >
      {status === "done" ? "Exported" : "Export"}
    </button>
  );
}
