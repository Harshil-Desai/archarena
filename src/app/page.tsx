"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useSessionStore } from "@/store/session";
import { PROMPTS, FREE_PROMPT_COUNT, type DesignPrompt } from "@/lib/prompts";

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function timeLimitLabel(seconds: number): string {
  return `${Math.ceil(seconds / 60)} min`;
}

function difficultyBadge(d: DesignPrompt["difficulty"]): {
  classes: string;
  label: string;
} {
  switch (d) {
    case "easy":
      return {
        classes:
          "bg-green-900/30 border border-green-700/50 text-green-300",
        label: "Easy",
      };
    case "medium":
      return {
        classes:
          "bg-amber-900/30 border border-amber-700/50 text-amber-300",
        label: "Medium",
      };
    case "hard":
      return {
        classes: "bg-red-900/30 border border-red-700/50 text-red-300",
        label: "Hard",
      };
  }
}

/* ──────────────────────────────────────────────
   Sub-components (not exported — page-local)
   ────────────────────────────────────────────── */

/** Sticky top navbar */
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-gray-800/60 backdrop-blur-md bg-gray-950/80">
      <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-gray-100">
        ArchArena
      </span>

      <div className="flex items-center gap-5">
        <a
          href="#"
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors font-[family-name:var(--font-display)]"
        >
          GitHub
        </a>
        <a
          href="#prompts"
          className="animate-glow-pulse inline-flex items-center gap-1.5 rounded-md border border-blue-500/60 bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-600/20 font-[family-name:var(--font-display)]"
        >
          Start Practicing →
        </a>
      </div>
    </nav>
  );
}

/** Fake canvas + AI chat mockup */
function SessionMockup() {
  return (
    <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-2xl shadow-black/40">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800/60 bg-gray-900">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[11px] text-gray-500 font-[family-name:var(--font-display)]">
          session — ArchArena
        </span>
      </div>

      <div className="flex min-h-[280px]">
        {/* Canvas side */}
        <div className="flex-[3] border-r border-gray-800/60 p-4 relative dot-grid">
          <span className="absolute top-2 left-3 text-[10px] uppercase tracking-widest text-gray-600 font-[family-name:var(--font-display)]">
            Your Canvas
          </span>
          {/* SVG sketch */}
          <svg
            viewBox="0 0 260 180"
            fill="none"
            className="w-full h-full mt-4"
            aria-hidden="true"
          >
            {/* Client box */}
            <rect
              x="10"
              y="70"
              width="56"
              height="32"
              rx="4"
              className="stroke-gray-500"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text
              x="38"
              y="90"
              textAnchor="middle"
              className="fill-gray-400 text-[9px] font-[family-name:var(--font-display)]"
            >
              Client
            </text>

            {/* Arrow 1 */}
            <path
              d="M68 86 L100 86"
              className="stroke-blue-500/70"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* API box */}
            <rect
              x="102"
              y="70"
              width="56"
              height="32"
              rx="4"
              className="stroke-blue-400/60"
              strokeWidth="1.5"
            />
            <text
              x="130"
              y="90"
              textAnchor="middle"
              className="fill-blue-300 text-[9px] font-[family-name:var(--font-display)]"
            >
              API
            </text>

            {/* Arrow 2 → DB */}
            <path
              d="M160 86 L192 86"
              className="stroke-blue-500/70"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* DB cylinder-ish */}
            <rect
              x="194"
              y="66"
              width="52"
              height="40"
              rx="4"
              className="stroke-green-500/60"
              strokeWidth="1.5"
            />
            <text
              x="220"
              y="90"
              textAnchor="middle"
              className="fill-green-300 text-[9px] font-[family-name:var(--font-display)]"
            >
              PostgreSQL
            </text>

            {/* Arrow API → Cache */}
            <path
              d="M130 102 L130 130"
              className="stroke-blue-500/70"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />

            {/* Cache box */}
            <rect
              x="102"
              y="132"
              width="56"
              height="32"
              rx="4"
              className="stroke-red-400/50"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text
              x="130"
              y="152"
              textAnchor="middle"
              className="fill-red-300 text-[9px] font-[family-name:var(--font-display)]"
            >
              Redis
            </text>

            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <path d="M0 0 L8 3 L0 6" className="fill-blue-500/70" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* AI chat side */}
        <div className="flex-[2] flex flex-col p-3 bg-gray-950/60">
          <span className="text-[10px] uppercase tracking-widest text-gray-600 mb-3 font-[family-name:var(--font-display)]">
            AI Interviewer
          </span>

          <div className="flex flex-col gap-2.5 flex-1">
            <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2">
              <p className="text-[11px] text-gray-300 leading-relaxed font-[family-name:var(--font-display)]">
                How would you handle 10M concurrent users?
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2">
              <p className="text-[11px] text-gray-300 leading-relaxed font-[family-name:var(--font-display)]">
                What happens if your cache goes down?
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2 flex items-center gap-1">
              <span className="text-[11px] text-gray-500 font-[family-name:var(--font-display)]">
                Analyzing your diagram
              </span>
              <span className="animate-blink text-blue-400 text-sm">▊</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** How-it-works step card */
function Step({
  num,
  title,
  text,
  icon,
}: {
  num: string;
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-[family-name:var(--font-display)] text-sm font-bold text-blue-400">
        {num}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-800 bg-gray-900 text-gray-400 shrink-0">
          {icon}
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-gray-100">
          {title}
        </h3>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
    </div>
  );
}

/** Prompt card */
function PromptCard({
  prompt,
  index,
  visible,
}: {
  prompt: DesignPrompt;
  index: number;
  visible: boolean;
}) {
  const router = useRouter();
  const setActivePrompt = useSessionStore((s) => s.setActivePrompt);
  const isUnlocked = index < FREE_PROMPT_COUNT;
  const badge = difficultyBadge(prompt.difficulty);

  return (
    <button
      type="button"
      disabled={!isUnlocked}
      onClick={() => {
        if (!isUnlocked) return;
        setActivePrompt(prompt);
        router.push(`/session/${nanoid(8)}`);
      }}
      className={[
        "group relative text-left p-5 rounded-xl border transition-all duration-300",
        "bg-gray-900/80 border-gray-800",
        isUnlocked
          ? "hover:border-gray-700 hover:bg-gray-800/80 cursor-pointer"
          : "opacity-50 cursor-not-allowed",
        visible
          ? "animate-fade-in"
          : "opacity-0",
      ].join(" ")}
      style={visible ? { animationDelay: `${index * 80}ms` } : undefined}
      aria-disabled={!isUnlocked}
      title={!isUnlocked ? "Available on Pro plan" : undefined}
    >
      {!isUnlocked && (
        <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-600/20 border border-amber-500/40 text-amber-300 font-[family-name:var(--font-display)]">
          Pro
        </span>
      )}

      <h3 className="font-[family-name:var(--font-display)] text-[15px] font-semibold text-gray-100 pr-12">
        {prompt.title}
      </h3>
      <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
        {prompt.description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={[
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-[family-name:var(--font-display)]",
            badge.classes,
          ].join(" ")}
        >
          {badge.label}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 tabular-nums font-[family-name:var(--font-display)]">
            {timeLimitLabel(prompt.timeLimit)}
          </span>
          {isUnlocked && (
            <svg
              className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

/** Feature callout */
function Feature({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 min-w-[220px] shrink-0">
      <div className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-800 bg-gray-900 text-gray-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-200 font-[family-name:var(--font-display)]">
          {label}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Icons (inline SVG — no imports)
   ────────────────────────────────────────────── */

function QuestionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        className="fill-current"
        fontSize="12"
        fontWeight="bold"
        stroke="none"
      >
        ?
      </text>
    </svg>
  );
}

function BoxArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="2" y="6" width="8" height="8" rx="2" />
      <rect x="14" y="6" width="8" height="8" rx="2" />
      <path d="M10 10h4" />
      <path d="M12.5 8l1.5 2-1.5 2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M21 12a9 9 0 01-9 9l-4-2H4a1 1 0 01-1-1v-4l-2-4a9 9 0 0120 2z" />
      <path d="M8 10h8M8 14h4" strokeLinecap="round" />
    </svg>
  );
}

function ComponentsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function DiagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </svg>
  );
}

function ScoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────── */

export default function Home() {
  const promptsRef = useRef<HTMLDivElement>(null);
  const cardsVisible = useRef(new Set<number>());
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    const el = promptsRef.current;
    if (!el) return;

    const cards = el.querySelectorAll("[data-prompt-card]");
    if (!cards.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.promptCard
            );
            if (!cardsVisible.current.has(idx)) {
              cardsVisible.current.add(idx);
              setVisibleCards(new Set(cardsVisible.current));
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    cards.forEach((card) => obs.observe(card));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 dot-grid">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 px-6 lg:px-16 py-20 lg:py-28 max-w-7xl mx-auto w-full">
        {/* Left copy */}
        <div className="flex-1 flex flex-col items-start gap-6">
          <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-gray-50">
            Practice system design.
            <br />
            <span className="text-blue-400">Get grilled by AI.</span>
          </h1>

          <p className="animate-fade-up delay-200 text-base lg:text-lg text-gray-400 max-w-lg leading-relaxed">
            Pick a question, draw your architecture, and get real-time follow-up
            questions from an AI interviewer that watches your canvas. Scored out
            of 100.
          </p>

          <a
            href="#prompts"
            className="animate-fade-up delay-300 animate-glow-pulse inline-flex items-center gap-2 rounded-md border border-blue-500/60 bg-blue-600/10 px-6 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-600/20 transition-colors font-[family-name:var(--font-display)]"
          >
            Pick a Question →
          </a>

          <p className="animate-fade-up delay-400 text-xs text-gray-600 font-[family-name:var(--font-display)]">
            No account needed. Start in 10 seconds.
          </p>
        </div>

        {/* Right mockup */}
        <div className="animate-fade-up delay-500 flex-1 flex justify-center lg:justify-end w-full">
          <SessionMockup />
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="px-6 lg:px-16 py-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          <Step
            num="01"
            title="Pick a question"
            text="Choose from 15 system design prompts — from URL shorteners to distributed databases."
            icon={<QuestionIcon />}
          />
          <Step
            num="02"
            title="Draw your solution"
            text="Use vendor-specific components — PostgreSQL, Redis, Kafka — on a real whiteboard canvas."
            icon={<BoxArrowIcon />}
          />
          <Step
            num="03"
            title="Get grilled"
            text="The AI watches your diagram in real-time and asks the questions a senior interviewer would."
            icon={<ChatIcon />}
          />
        </div>
      </section>

      {/* ─── Prompt selector ─── */}
      <section
        id="prompts"
        className="px-6 lg:px-16 py-16 max-w-7xl mx-auto w-full"
      >
        <div className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-gray-100">
            Choose a question to start
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-[family-name:var(--font-display)]">
            Free tier includes {FREE_PROMPT_COUNT} questions. No sign-up.
          </p>
        </div>

        <div
          ref={promptsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {PROMPTS.map((prompt, idx) => (
            <div key={prompt.id} data-prompt-card={idx}>
              <PromptCard
                prompt={prompt}
                index={idx}
                visible={visibleCards.has(idx)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature strip ─── */}
      <section className="px-6 lg:px-16 py-12 max-w-7xl mx-auto w-full border-t border-gray-800/50">
        <div className="flex gap-8 lg:gap-12 overflow-x-auto pb-2 scrollbar-none">
          <Feature
            icon={<ComponentsIcon />}
            label="Vendor-specific components"
            text="PostgreSQL, Redis, Kafka — real icons, not rectangles."
          />
          <Feature
            icon={<DiagramIcon />}
            label="AI that reads your diagram"
            text="Not just your chat — it parses your actual architecture."
          />
          <Feature
            icon={<ScoreIcon />}
            label="Scored out of 100"
            text="Breakdown by scalability, reliability, and tradeoffs."
          />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="mt-auto flex items-center justify-between px-6 lg:px-16 py-6 border-t border-gray-800/50 text-xs text-gray-600">
        <span className="font-[family-name:var(--font-display)]">
          ArchArena &copy; 2025
        </span>
        <span>Built with ❤️ by Harshil</span>
      </footer>
    </div>
  );
}
