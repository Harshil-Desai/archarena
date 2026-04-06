"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useSessionStore } from "@/store/session";
import { PROMPTS, FREE_PROMPT_COUNT, type DesignPrompt } from "@/lib/prompts";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/auth/UserMenu";

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
      <Link
        href="/"
        className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-gray-100 hover:text-blue-400 transition-colors"
      >
        ArchArena
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/pricing"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Pricing
        </Link>
        <a
          href="#faq"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          FAQ
        </a>
        <a
          href="https://github.com/Harshil-Desai/archarena"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          GitHub
        </a>
        <UserMenu />
      </div>
    </nav>
  );
}

/** Fake canvas + AI chat mockup */
function SessionMockup() {
  return (
    <div className="group w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-2xl shadow-black/40 relative">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Top bar */}
      <div className="relative flex items-center gap-2 px-4 py-2.5 border-b border-gray-800/60 bg-gray-900">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[11px] text-gray-500 font-[family-name:var(--font-display)]">
          session — ArchArena
        </span>
      </div>

      <div className="relative flex min-h-[280px]">
        {/* Canvas side */}
        <div className="flex-[3] border-r border-gray-800/60 p-4 relative dot-grid overflow-hidden">
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
            {/* Animated Path 1 (Data Flow) */}
            <path
              d="M68 86 L100 86"
              className="stroke-blue-500/30"
              strokeWidth="1.5"
            />
            <path
              d="M68 86 L100 86"
              className="stroke-blue-400"
              strokeWidth="2"
              strokeDasharray="10 20"
              markerEnd="url(#arrowhead)"
            >
              <animate attributeName="stroke-dashoffset" from="30" to="0" dur="2s" repeatCount="indefinite" />
            </path>

            {/* Client box */}
            <rect
              x="10"
              y="70"
              width="56"
              height="32"
              rx="4"
              className="stroke-gray-600 fill-gray-900/40"
              strokeWidth="1.5"
            />
            <text
              x="38"
              y="90"
              textAnchor="middle"
              className="fill-gray-400 text-[9px] font-[family-name:var(--font-display)]"
            >
              Client
            </text>

            {/* API box with glow animate */}
            <rect
              x="102"
              y="70"
              width="56"
              height="32"
              rx="4"
              className="stroke-blue-500/60 fill-blue-500/5"
              strokeWidth="1.5"
            >
              <animate attributeName="stroke-opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
            </rect>
            <text
              x="130"
              y="90"
              textAnchor="middle"
              className="fill-blue-300 text-[9px] font-[family-name:var(--font-display)]"
            >
              API
            </text>

            {/* Path to DB */}
            <path
              d="M160 86 L192 86"
              className="stroke-emerald-500/40"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              markerEnd="url(#arrowhead-emerald)"
            />

            {/* DB cylinder-ish */}
            <rect
              x="194"
              y="66"
              width="52"
              height="40"
              rx="4"
              className="stroke-emerald-500/60 fill-emerald-500/5"
              strokeWidth="1.5"
            />
            <text
              x="220"
              y="90"
              textAnchor="middle"
              className="fill-emerald-300 text-[9px] font-[family-name:var(--font-display)] font-semibold"
            >
              Postgres
            </text>

            {/* Path to Cache */}
            <path
              d="M130 102 L130 130"
              className="stroke-red-500/40"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead-red)"
            />

            {/* Cache box */}
            <rect
              x="102"
              y="132"
              width="56"
              height="32"
              rx="4"
              className="stroke-red-400/50 fill-red-500/5"
              strokeWidth="1.5"
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
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0 0 L8 3 L0 6" className="fill-blue-400" />
              </marker>
              <marker id="arrowhead-emerald" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0 0 L8 3 L0 6" className="fill-emerald-400" />
              </marker>
              <marker id="arrowhead-red" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0 0 L8 3 L0 6" className="fill-red-400" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* AI chat side */}
        <div className="flex-[2] flex flex-col p-3 bg-gray-950/60">
          <span className="text-[10px] uppercase tracking-widest text-gray-600 mb-3 font-[family-name:var(--font-display)] flex items-center gap-2">
            AI Interviewer
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          </span>

          <div className="flex flex-col gap-2.5 flex-1">
            <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2 animate-fade-in delay-200">
              <p className="text-[11px] text-gray-300 leading-relaxed font-[family-name:var(--font-display)]">
                How would you handle 10M concurrent users?
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2 animate-fade-in delay-500">
              <p className="text-[11px] text-gray-300 leading-relaxed font-[family-name:var(--font-display)]">
                What happens if your cache goes down?
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2 flex items-center gap-1.5 animate-fade-in delay-800">
              <span className="text-[11px] text-gray-500 font-[family-name:var(--font-display)]">
                Analyzing diagram
              </span>
              <span className="flex gap-0.5">
                <span className="h-1 w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1 w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** New high-impact Prompt Selector */
function PromptSelector() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(PROMPTS[0].id);
  const { data: session } = useSession();
  const setActivePrompt = useSessionStore((s) => s.setActivePrompt);

  const handleStart = () => {
    const prompt = PROMPTS.find(p => p.id === selectedId);
    if (!prompt) return;

    if (!session) {
      router.push(`/login?from=/`);
      return;
    }

    setActivePrompt(prompt);
    router.push(`/session/${nanoid(8)}`);
  };

  return (
    <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-lg">
      <div className="relative flex-1">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full appearance-none bg-gray-900 border border-gray-700 text-gray-100 px-4 py-3.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all"
        >
          {PROMPTS.slice(0, FREE_PROMPT_COUNT).map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.difficulty})
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <button
        onClick={handleStart}
        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 font-[family-name:var(--font-display)] whitespace-nowrap"
      >
        Start Session →
      </button>
    </div>
  );
}

/** Trust / Social Proof section */
function SocialProof() {
  return (
    <div className="w-full border-y border-gray-800/50 bg-gray-900/20 py-8 lg:py-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-2xl lg:text-3xl font-bold text-gray-100 font-[family-name:var(--font-display)]">10,000+</span>
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500">Interviews Conducted</span>
        </div>

        <div className="flex flex-wrap justify-center gap-8 lg:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {["Meta", "Google", "Amazon", "Uber", "Netflix"].map((brand) => (
            <span key={brand} className="text-sm font-bold text-gray-400 font-[family-name:var(--font-display)]">
              {brand}
            </span>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4 pl-8 border-l border-gray-800">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 italic max-w-[140px]">
            &quot;The most realistic system design prep tool I&apos;ve used.&quot;
          </p>
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

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "infra":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-blue-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <path d="M6 6h.01M6 18h.01" strokeWidth="3" />
        </svg>
      );
    case "feed":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-emerald-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" strokeWidth="3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
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
  const { data: session } = useSession();
  const setActivePrompt = useSessionStore((s) => s.setActivePrompt);
  const isUnlocked = index < FREE_PROMPT_COUNT;
  const badge = difficultyBadge(prompt.difficulty);

  return (
    <button
      type="button"
      onClick={() => {
        if (!isUnlocked) {
          router.push("/pricing");
          return;
        }
        if (!session) {
          router.push("/login?from=/");
          return;
        }
        setActivePrompt(prompt);
        router.push(`/session/${nanoid(8)}`);
      }}
      className={[
        "group relative text-left p-6 rounded-2xl border transition-all duration-500 font-sans",
        "bg-gray-950/40 border-gray-800/60 backdrop-blur-md",
        "min-h-[220px] flex flex-col justify-between",
        "hover:border-blue-500/50 hover:bg-gray-900/60 cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10",
        !isUnlocked && "opacity-80 active:scale-95",
        visible ? "animate-fade-in" : "opacity-0",
      ].join(" ")}
      style={visible ? { animationDelay: `${index * 80}ms` } : undefined}
      title={!isUnlocked ? "Available on Pro plan" : undefined}
    >
      {/* Top Section */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
              <CategoryIcon category={prompt.category} />
            </div>
            {!isUnlocked && (
              <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 text-amber-400 font-[family-name:var(--font-display)]">
                Pro
              </span>
            )}
          </div>
          {isUnlocked && (
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
               <svg
                className="w-5 h-5 text-blue-400 shadow-blue-500/50 filter drop-shadow"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </div>

        <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-gray-50 leading-tight">
          {prompt.title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed font-medium line-clamp-3">
          {prompt.description}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-800/40 pt-4">
        <span
          className={[
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-[family-name:var(--font-display)] uppercase tracking-wide",
            badge.classes,
          ].join(" ")}
        >
          {badge.label}
        </span>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-gray-500">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
             </svg>
             <span className="text-[10px] tabular-nums font-[family-name:var(--font-display)] font-semibold">
               {timeLimitLabel(prompt.timeLimit)}
             </span>
          </div>
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
          <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-gray-50">
            Practice system design.
            <br />
            <span className="text-blue-500">Get grilled by AI.</span>
          </h1>

          <p className="animate-fade-up delay-200 text-base lg:text-lg text-gray-200 max-w-lg font-medium leading-relaxed">
            Pick a question, draw your architecture, and get real-time follow-up
            questions from an AI interviewer that watches your canvas. Scored out
            of 100.
          </p>

          <PromptSelector />
        </div>

        {/* Right mockup */}
        <div className="animate-fade-up delay-500 flex-1 flex justify-center lg:justify-end w-full">
          <SessionMockup />
        </div>
      </section>

      {/* <SocialProof /> */}

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
