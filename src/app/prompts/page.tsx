"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/ui/NavBar";
import { Icon } from "@/components/ui/Icon";
import { PROMPTS, FREE_PROMPT_COUNT } from "@/lib/prompts";
import { useSessionStore } from "@/store/session";

type DifficultyFilter = "all" | "easy" | "medium" | "hard";

export default function PromptsPage() {
  const [filter, setFilter] = useState<DifficultyFilter>("all");
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const setActivePrompt = useSessionStore((s) => s.setActivePrompt);

  const filtered = PROMPTS.filter((p) => {
    const matchesDiff = filter === "all" || p.difficulty === filter;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchesDiff && matchesSearch;
  });

  async function handleSelect(promptId: string, idx: number) {
    if (idx >= FREE_PROMPT_COUNT) return; // locked
    setStarting(promptId);
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      });
      if (!res.ok) {
        if (res.status === 401) { router.push("/login?from=/prompts"); return; }
        return;
      }
      const data = await res.json();
      const prompt = PROMPTS.find((p) => p.id === promptId);
      if (prompt) setActivePrompt(prompt);
      startTransition(() => router.push(`/session/${data.sessionId}`));
    } finally {
      setStarting(null);
    }
  }

  const filters: DifficultyFilter[] = ["all", "easy", "medium", "hard"];

  return (
    <div style={{ minHeight: "100vh" }}>
      <NavBar />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 24px 60px" }}>
        <div className="row between" style={{ marginBottom: 32 }}>
          <div className="col gap-1">
            <span className="eyebrow">The roster</span>
            <h1
              className="serif"
              style={{ fontSize: 40, margin: 0, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, paddingBottom: 4 }}
            >
              Pick your <em>opponent.</em>
            </h1>
          </div>
          <div className="row gap-2">
            {/* Search */}
            <div
              className="row gap-2"
              style={{
                background: "var(--bg-2)", border: "1px solid var(--line-2)",
                borderRadius: 10, padding: "8px 12px", width: 280,
              }}
            >
              <Icon name="search" size={14} style={{ color: "var(--text-4)" }} />
              <input
                placeholder="Search prompts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "transparent", border: 0, outline: 0,
                  fontSize: 13, flex: 1, color: "var(--text-1)",
                }}
              />
            </div>
            {/* Difficulty filter */}
            <div
              className="row"
              style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: 3 }}
            >
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 12px", borderRadius: 7, fontSize: 12,
                    textTransform: "capitalize", cursor: "pointer",
                    background: filter === f ? "var(--bg-3)" : "transparent",
                    color: filter === f ? "var(--text-1)" : "var(--text-3)",
                    fontFamily: "var(--font-mono)", border: 0,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {filtered.map((p) => {
            const idx = PROMPTS.indexOf(p);
            const locked = idx >= FREE_PROMPT_COUNT;
            const isStarting = starting === p.id || (isPending && starting === p.id);
            const diffClass = p.difficulty === "easy" ? "chip-easy" : p.difficulty === "medium" ? "chip-med" : "chip-hard";

            return (
              <div
                key={p.id}
                onClick={() => !locked && handleSelect(p.id, idx)}
                className="card"
                style={{
                  padding: 20,
                  opacity: locked ? 0.7 : 1,
                  cursor: locked ? "default" : isStarting ? "wait" : "pointer",
                  position: "relative",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => {
                  if (!locked) {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line-3)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line-1)";
                }}
              >
                {locked && (
                  <div style={{
                    position: "absolute", top: 14, right: 14,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 9px", borderRadius: 999,
                    background: "var(--bg-3)", border: "1px solid var(--line-2)",
                    fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--gold)",
                  }}>
                    <Icon name="lock" size={10} /> PRO
                  </div>
                )}

                <div className="row between" style={{ marginBottom: 16 }}>
                  <span className={`chip ${diffClass}`}>{p.difficulty}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--text-5)" }}>
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3
                  className="serif"
                  style={{ fontSize: 22, margin: 0, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--text-1)", lineHeight: 1.15 }}
                >
                  {p.title}
                </h3>
                <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.55, margin: "14px 0 18px" }}>
                  {p.description}
                </p>

                <div className="row gap-1" style={{ flexWrap: "wrap", marginBottom: 18 }}>
                  <span className="mono" style={{ fontSize: 10, color: "var(--text-4)" }}>{p.category}</span>
                </div>

                <div
                  className="row between"
                  style={{ paddingTop: 14, borderTop: "1px solid var(--line-1)", fontFamily: "var(--font-mono)", fontSize: 11 }}
                >
                  <span style={{ color: "var(--text-4)" }}>
                    ◷ {Math.round(p.timeLimit / 60)} min
                  </span>
                  {isStarting ? (
                    <span style={{ color: "var(--accent)", fontSize: 10 }}>Starting…</span>
                  ) : locked ? (
                    <span style={{ color: "var(--text-5)", fontSize: 10 }}>PRO ONLY</span>
                  ) : (
                    <span style={{ color: "var(--accent)", fontSize: 10 }}>
                      Start <Icon name="arrow-right" size={10} style={{ verticalAlign: "middle" }} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
