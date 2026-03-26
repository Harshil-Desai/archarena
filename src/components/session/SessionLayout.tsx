"use client";

import type { ReactNode } from "react";
import { PromptBadge } from "../prompt/PromptBadge";
import { SessionTimer } from "./SessionTimer";

export function SessionLayout({
  left,
  notes,
  chat,
  onScoreClick,
  isScorePanelOpen,
  onCloseScorePanel,
  scorePanel,
  scoreButtonDisabled,
}: {
  left: ReactNode;
  notes: ReactNode;
  chat: ReactNode;
  onScoreClick: () => void;
  isScorePanelOpen: boolean;
  onCloseScorePanel: () => void;
  scorePanel: ReactNode;
  scoreButtonDisabled?: boolean;
}) {
  return (
    <div className="h-screen bg-gray-950 overflow-hidden flex flex-col">
      <header
        className="h-12 border-b border-gray-800 flex items-center px-4"
        role="banner"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-4">
          <div className="justify-self-start">
            <PromptBadge />
          </div>

          <div className="justify-self-center">
            <SessionTimer />
          </div>

          <div className="justify-self-end">
            <button
              type="button"
              onClick={onScoreClick}
              disabled={scoreButtonDisabled}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium border transition-colors",
                "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              Score My Design
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-[3] overflow-hidden">{left}</div>

        <div className="flex-[2] flex flex-col border-l border-gray-800 overflow-hidden">
          <div className="flex-1 overflow-hidden border-b border-gray-800">
            {notes}
          </div>
          <div className="flex-1 overflow-hidden">{chat}</div>
        </div>
      </main>

      <div
        className={[
          "fixed inset-0 z-50 transition-opacity duration-300",
          isScorePanelOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!isScorePanelOpen}
      >
        <button
          type="button"
          className="absolute inset-0 w-full h-full bg-black/40"
          onClick={onCloseScorePanel}
          aria-label="Close score panel"
        />

        <aside
          className={[
            "absolute top-12 right-0 bottom-0 w-[440px] max-w-[calc(100%-1rem)]",
            "transition-transform duration-300 ease-out",
            isScorePanelOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-full p-4">{scorePanel}</div>
        </aside>
      </div>
    </div>
  );
}

