"use client";

import type { ReactNode } from "react";
import { useSessionStore } from "@/store/session";
import type { LlmProvider } from "@/types";
import { PromptBadge } from "../prompt/PromptBadge";
import { SessionTimer } from "./SessionTimer";
import { UsagePill } from "./UsagePill";
import { UserMenu } from "@/components/auth/UserMenu";

const PROVIDERS: { key: LlmProvider; label: string }[] = [
  { key: "anthropic", label: "Anthropic" },
  { key: "gemini", label: "Gemini" },
];

function LlmProviderToggle() {
  const llmProvider = useSessionStore((s) => s.llmProvider);
  const setLlmProvider = useSessionStore((s) => s.setLlmProvider);

  return (
    <div
      className="flex rounded-lg border border-gray-700 overflow-hidden"
      role="radiogroup"
      aria-label="LLM provider"
    >
      {PROVIDERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={llmProvider === key}
          onClick={() => setLlmProvider(key)}
          className={[
            "px-3 py-1.5 text-xs font-medium transition-colors",
            llmProvider === key
              ? "bg-gray-700 text-gray-100"
              : "bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function SessionLayout({
  left,
  chat,
  notes,
  exportButton,
  onScoreClick,
  onClearSession,
  isScorePanelOpen,
  onCloseScorePanel,
  scorePanel,
  scoreButtonDisabled,
  scoreButtonTooltip,
}: {
  left: ReactNode;
  chat: ReactNode;
  notes: ReactNode;
  exportButton?: ReactNode;
  onScoreClick: () => void;
  onClearSession: () => void;
  isScorePanelOpen: boolean;
  onCloseScorePanel: () => void;
  scorePanel: ReactNode;
  scoreButtonDisabled?: boolean;
  scoreButtonTooltip?: string;
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

          <div className="justify-self-end flex items-center gap-4">
            <button
              type="button"
              onClick={onClearSession}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Reset
            </button>
            <LlmProviderToggle />
            <div className="flex items-center gap-2 ml-auto">
              {exportButton}
              <UsagePill />
              <UserMenu />
              <button
                type="button"
                onClick={onScoreClick}
                disabled={scoreButtonDisabled}
                title={scoreButtonDisabled ? scoreButtonTooltip : undefined}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium border transition-colors",
                  "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                Run Review
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-[3] overflow-hidden">{left}</div>

        <div className="flex-[2] flex flex-col border-l border-gray-800 overflow-hidden">
          <div className="flex-1 overflow-hidden border-b border-gray-800">
            {notes}
          </div>
          <div className="flex-1 overflow-hidden">
            {chat}
          </div>
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
