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
    <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-3">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-gray-100 outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:text-gray-500"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">
          Enter sends. Shift+Enter adds a line.
        </p>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || isEmpty}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
