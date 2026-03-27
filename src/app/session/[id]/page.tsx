 "use client";

import { use, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TLRecord } from "@tldraw/tldraw";
import type { SemanticGraph, ScoreResult } from "@/types";
import { LIMITS } from "@/lib/limits";
import { useSessionStore } from "@/store/session";
import { InterviewCanvas } from "@/components/canvas/InterviewCanvas";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { SessionLayout } from "@/components/session/SessionLayout";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ScorePanel } from "@/components/score/ScorePanel";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const activePrompt = useSessionStore((s) => s.activePrompt);

  useEffect(() => {
    if (!activePrompt) {
      router.push("/");
    }
  }, [activePrompt, router]);

  if (!activePrompt) return null;

  const notes = useSessionStore((s) => s.notes);
  const history = useSessionStore((s) => s.messages);
  const scoresUsed = useSessionStore((s) => s.scoresUsed);
  const incrementScores = useSessionStore((s) => s.incrementScores);
  const setScoring = useSessionStore((s) => s.setScoring);
  const setScoreResult = useSessionStore((s) => s.setScoreResult);
  const isScoring = useSessionStore((s) => s.isScoring);
  const llmProvider = useSessionStore((s) => s.llmProvider);

  const latestGraphRef = useRef<SemanticGraph | null>(null);
  const [canvasRecords, setCanvasRecords] = useState<TLRecord[]>([]);
  const [isScorePanelOpen, setIsScorePanelOpen] = useState(false);

  async function handleScoreClick() {
    // Always open the score overlay on click.
    setIsScorePanelOpen(true);

    if (isScoring) return;
    const used = scoresUsed;

    if (used >= LIMITS.free.scoresPerSession) {
      // ScorePanel will render the upgrade nudge in its empty state.
      return;
    }

    if (!activePrompt) return;
    if (!latestGraphRef.current) return;

    incrementScores();
    setScoring(true);

    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          graph: latestGraphRef.current,
          notes,
          history,
          scoresUsed: used,
          llmProvider,
        }),
      });

      if (!res.ok) {
        throw new Error(`Score request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Missing response stream");
      }

      const decoder = new TextDecoder();
      let jsonText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          jsonText += decoder.decode(value, { stream: true });
        }
      }
      jsonText += decoder.decode();

      const parsed: ScoreResult = JSON.parse(jsonText);
      setScoreResult(parsed);
    } finally {
      setScoring(false);
    }
  }

  return (
    <SessionLayout
      left={
        <InterviewCanvas
          onGraphChange={(graph) => {
            latestGraphRef.current = graph;
          }}
          onCanvasRecordsChange={setCanvasRecords}
        />
      }
      notes={<NotesPanel />}
      chat={<ChatPanel canvasRecords={canvasRecords} />}
      onScoreClick={handleScoreClick}
      isScorePanelOpen={isScorePanelOpen}
      onCloseScorePanel={() => setIsScorePanelOpen(false)}
      scorePanel={<ScorePanel />}
      scoreButtonDisabled={isScoring}
    />
  );
}

