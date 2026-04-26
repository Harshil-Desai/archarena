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
      role="radiogroup"
      aria-label="LLM provider"
      style={{
        display: "flex",
        borderRadius: 8,
        border: "1px solid var(--line-2)",
        background: "var(--bg-2)",
        overflow: "hidden",
      }}
    >
      {PROVIDERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={llmProvider === key}
          onClick={() => setLlmProvider(key)}
          style={{
            padding: "6px 12px",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            transition: "background .15s, color .15s",
            background: llmProvider === key ? "var(--bg-3)" : "transparent",
            color: llmProvider === key ? "var(--text-1)" : "var(--text-3)",
          }}
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
    <div
      className="flex flex-col"
      style={{ height: "100vh", overflow: "hidden", background: "var(--bg-0)" }}
    >
      <header
        role="banner"
        style={{
          height: 52,
          borderBottom: "1px solid var(--line-1)",
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          background: "color-mix(in oklch, var(--bg-1) 70%, transparent)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-4">
          <div className="justify-self-start">
            <PromptBadge />
          </div>

          <div className="justify-self-center">
            <SessionTimer />
          </div>

          <div className="justify-self-end flex items-center gap-3">
            <button
              type="button"
              onClick={onClearSession}
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                color: "var(--text-4)",
                transition: "color .15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-4)";
              }}
            >
              RESET
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
                className="btn btn-primary"
                style={{
                  padding: "8px 14px",
                  fontSize: 12.5,
                  opacity: scoreButtonDisabled ? 0.55 : 1,
                  cursor: scoreButtonDisabled ? "not-allowed" : "pointer",
                }}
              >
                Run Review
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-[3] overflow-hidden">{left}</div>

        <div
          className="flex-[2] flex min-h-0 flex-col overflow-hidden"
          style={{
            borderLeft: "1px solid var(--line-1)",
            background: "color-mix(in oklch, var(--bg-1) 60%, transparent)",
          }}
        >
          <div
            className="flex-[1] min-h-0 overflow-hidden"
            style={{ borderBottom: "1px solid var(--line-1)" }}
          >
            {notes}
          </div>
          <div className="flex-[2] min-h-0 overflow-hidden">{chat}</div>
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
          onClick={onCloseScorePanel}
          aria-label="Close score panel"
          className="absolute inset-0 w-full h-full"
          style={{ background: "rgba(7, 7, 15, 0.6)", backdropFilter: "blur(2px)" }}
        />

        <aside
          className={[
            "absolute top-[52px] right-0 bottom-0 w-[460px] max-w-[calc(100%-1rem)]",
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
