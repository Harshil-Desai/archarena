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
        <div
          className={[
            "rounded-lg p-3 text-sm leading-relaxed break-words",
            isUser ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100",
          ].join(" ")}
        >
          {message.content}
        </div>
        <div className={`mt-1.5 flex items-center gap-2 px-1 ${isUser ? "justify-end" : ""}`}>
          <span className="text-[10px] text-gray-500">
            {getRelativeTime(message.timestamp)}
          </span>
          {message.model && !isUser && (
            <span className="rounded bg-gray-800/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-gray-500">
              {message.model}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
