"use client";

import { KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Ask about a bottleneck, tradeoff, or failure mode.",
}: ChatInputProps) {
  const isEmpty = value.trim().length === 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !isEmpty) {
        onSend();
      }
    }
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--line-2)",
        background: "color-mix(in oklch, var(--bg-0) 80%, transparent)",
        padding: 12,
      }}
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none border-0 bg-transparent outline-none"
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: disabled ? "var(--text-4)" : "var(--text-1)",
          cursor: disabled ? "not-allowed" : "text",
          fontFamily: "var(--font-sans)",
        }}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p
          style={{
            fontSize: 11,
            color: "var(--text-4)",
            fontFamily: "var(--font-mono)",
            margin: 0,
          }}
        >
          Enter sends. Shift+Enter adds a line.
        </p>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || isEmpty}
          className="btn btn-primary"
          style={{
            padding: "8px 14px",
            fontSize: 12.5,
            opacity: disabled || isEmpty ? 0.5 : 1,
            cursor: disabled || isEmpty ? "not-allowed" : "pointer",
          }}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
