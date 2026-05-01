"use client";

import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

function getRelativeTime(timestamp: number) {
  const mins = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (mins === 0) return "now";
  return `${mins}m ago`;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[90%] overflow-hidden ${isUser ? "" : "mr-auto"}`}>
        {isUser ? (
          <div
            style={{
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.55,
              wordBreak: "break-word",
              background: "var(--accent-soft)",
              border: "1px solid color-mix(in oklch, var(--accent) 30%, transparent)",
              color: "var(--text-1)",
            }}
          >
            {message.content}
          </div>
        ) : (
          <div
            className="card-inset"
            style={{
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.55,
              wordBreak: "break-word",
              color: "var(--text-2)",
            }}
          >
            {message.content}
          </div>
        )}
        <div
          className={`mt-1.5 flex items-center gap-2 px-1 ${isUser ? "justify-end" : ""}`}
        >
          <span
            style={{
              fontSize: 10,
              color: "var(--text-4)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {getRelativeTime(message.timestamp)}
          </span>
          {message.model && !isUser && (
            <span
              style={{
                borderRadius: 4,
                padding: "2px 6px",
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-4)",
                background: "var(--bg-3)",
                border: "1px solid var(--line-1)",
              }}
            >
              {message.model}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
