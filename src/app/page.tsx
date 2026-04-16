"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/auth/UserMenu";
import { ProBadge } from "@/components/ui/ProBadge";
import { PROMPTS, FREE_PROMPT_COUNT, type DesignPrompt } from "@/lib/prompts";
import { useSessionStore } from "@/store/session";

type Tier = "FREE" | "PRO" | "PREMIUM";

type MarketingPlan = {
  tier: Tier;
  name: string;
  price: string;
  features: string[];
  cta: string;
};

const PRICING_PLANS: MarketingPlan[] = [
  {
    tier: "FREE",
    name: "Free",
    price: "$0 / month",
    features: [
      "5 system design questions",
      "5 AI hints per session",
      "1 score per session",
      "No account needed to browse",
    ],
    cta: "Get started free",
  },
  {
    tier: "PRO",
    name: "Pro",
    price: "$12 / month",
    features: [
      "All 15 questions",
      "Unlimited AI hints",
      "Unlimited scoring",
      "Full session history",
      "PNG export",
    ],
    cta: "Upgrade to Pro",
  },
  {
    tier: "PREMIUM",
    name: "Premium",
    price: "$29 / month",
    features: [
      "Everything in Pro",
      "Custom prompts",
      "Custom AI interviewer persona",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
  },
];

function getTier(value?: string | null): Tier {
  if (value === "PRO" || value === "PREMIUM") {
    return value;
  }

  return "FREE";
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

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

function Navbar({ onPricingClick }: { onPricingClick: () => void }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-800/60 bg-gray-950/80 px-6 py-4 backdrop-blur-md">
      <Link
        href="/"
        className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-gray-100 transition-colors hover:text-blue-400"
      >
        SysDraw
      </Link>

      <div className="flex items-center gap-4">
        <a
          href="#"
          className="text-sm text-gray-500 transition-colors hover:text-gray-300"
        >
          GitHub
        </a>
        <span className="text-sm text-gray-700" aria-hidden="true">
          &middot;
        </span>
        <button
          type="button"
          onClick={onPricingClick}
          className="text-sm text-gray-500 transition-colors hover:text-gray-300"
        >
          Pricing
        </button>
        <UserMenu />
      </div>
    </nav>
  );
}

function SessionMockup() {
  return (
    <div className="group relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 shadow-2xl shadow-black/40">
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500/20 to-emerald-500/20 blur-xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

      <div className="relative flex items-center gap-2 border-b border-gray-800/60 bg-gray-900 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 font-[family-name:var(--font-display)] text-[11px] text-gray-500">
          session — SysDraw
        </span>
      </div>

      <div className="relative flex min-h-[280px]">
        <div className="dot-grid relative flex-[3] overflow-hidden border-r border-gray-800/60 p-4">
          <span className="absolute top-2 left-3 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-widest text-gray-600">
            Your Canvas
          </span>
          <svg
            viewBox="0 0 260 180"
            fill="none"
            className="mt-4 h-full w-full"
            aria-hidden="true"
          >
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
              <animate
                attributeName="stroke-dashoffset"
                from="30"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>

            <rect
              x="10"
              y="70"
              width="56"
              height="32"
              rx="4"
              className="fill-gray-900/40 stroke-gray-600"
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

            <rect
              x="102"
              y="70"
              width="56"
              height="32"
              rx="4"
              className="fill-blue-500/5 stroke-blue-500/60"
              strokeWidth="1.5"
            >
              <animate
                attributeName="stroke-opacity"
                values="0.4;1;0.4"
                dur="3s"
                repeatCount="indefinite"
              />
            </rect>
            <text
              x="130"
              y="90"
              textAnchor="middle"
              className="fill-blue-300 text-[9px] font-[family-name:var(--font-display)]"
            >
              API
            </text>

            <path
              d="M160 86 L192 86"
              className="stroke-emerald-500/40"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              markerEnd="url(#arrowhead-emerald)"
            />

            <rect
              x="194"
              y="66"
              width="52"
              height="40"
              rx="4"
              className="fill-emerald-500/5 stroke-emerald-500/60"
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

            <path
              d="M130 102 L130 130"
              className="stroke-red-500/40"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead-red)"
            />

            <rect
              x="102"
              y="132"
              width="56"
              height="32"
              rx="4"
              className="fill-red-500/5 stroke-red-400/50"
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
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <path d="M0 0 L8 3 L0 6" className="fill-blue-400" />
              </marker>
              <marker
                id="arrowhead-emerald"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <path d="M0 0 L8 3 L0 6" className="fill-emerald-400" />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <path d="M0 0 L8 3 L0 6" className="fill-red-400" />
              </marker>
            </defs>
          </svg>
        </div>

        <div className="flex flex-[2] flex-col bg-gray-950/60 p-3">
          <span className="mb-3 flex items-center gap-2 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-widest text-gray-600">
            Interviewer
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
          </span>

          <div className="flex flex-1 flex-col gap-2.5">
            <div className="animate-fade-in rounded-lg border border-gray-700/40 bg-gray-800/60 px-3 py-2 delay-200">
              <p className="font-[family-name:var(--font-display)] text-[11px] leading-relaxed text-gray-300">
                How would you handle 10M concurrent users?
              </p>
            </div>
            <div className="animate-fade-in rounded-lg border border-gray-700/40 bg-gray-800/60 px-3 py-2 delay-500">
              <p className="font-[family-name:var(--font-display)] text-[11px] leading-relaxed text-gray-300">
                What happens if your cache goes down?
              </p>
            </div>
            <div className="animate-fade-in flex items-center gap-1.5 rounded-lg border border-gray-700/40 bg-gray-800/60 px-3 py-2 delay-800">
              <span className="font-[family-name:var(--font-display)] text-[11px] text-gray-500">
                Analyzing diagram
              </span>
              <span className="flex gap-0.5">
                <span className="h-1 w-1 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-blue-400" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-gray-400">
          {icon}
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-gray-100">
          {title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-gray-400">{text}</p>
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "infra":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 text-blue-400"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <path d="M6 6h.01M6 18h.01" strokeWidth="3" />
        </svg>
      );
    case "feed":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 text-emerald-400"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" strokeWidth="3" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 text-gray-400"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
}

function PromptCard({
  prompt,
  index,
  visible,
  interactive,
  showProBadge,
  lockedMessage,
  lockedHref,
  onClick,
}: {
  prompt: DesignPrompt;
  index: number;
  visible: boolean;
  interactive: boolean;
  showProBadge: boolean;
  /** If set, card is locked and shows this message in the overlay */
  lockedMessage?: string;
  /** Where the overlay button navigates */
  lockedHref?: string;
  onClick: () => void;
}) {
  const badge = difficultyBadge(prompt.difficulty);
  const isLocked = Boolean(lockedMessage);

  return (
    <div
      className={[
        "group relative flex min-h-[220px] flex-col justify-between rounded-2xl border p-6 text-left font-sans transition-all duration-500",
        "border-gray-800/60 bg-gray-950/40 backdrop-blur-md",
        interactive
          ? "cursor-pointer hover:-translate-y-1.5 hover:border-blue-500/50 hover:bg-gray-900/60 hover:shadow-2xl hover:shadow-blue-900/10"
          : "cursor-default opacity-80",
        visible ? "animate-fade-in" : "opacity-0",
      ].join(" ")}
      style={visible ? { animationDelay: `${index * 80}ms` } : undefined}
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      {/* Locked overlay */}
      {isLocked && (
        <button
          type="button"
          onClick={onClick}
          aria-label={lockedMessage}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-gray-950/70 backdrop-blur-sm transition-opacity hover:bg-gray-950/80"
        >
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span className="font-[family-name:var(--font-display)] text-xs font-semibold text-gray-300">
            {lockedMessage}
          </span>
        </button>
      )}

      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 transition-colors group-hover:bg-gray-800">
              <CategoryIcon category={prompt.category} />
            </div>
            {showProBadge ? <ProBadge size="xs" /> : null}
          </div>
          {interactive ? (
            <div className="translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <svg
                className="h-5 w-5 text-blue-400 drop-shadow"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          ) : null}
        </div>

        <h3 className="font-[family-name:var(--font-display)] text-base font-bold leading-tight text-gray-50">
          {prompt.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-gray-500">
          {prompt.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-gray-800/40 pt-4">
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-wide",
            badge.classes,
          ].join(" ")}
        >
          {badge.label}
        </span>

        <div className="flex items-center gap-2 text-gray-500">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="font-[family-name:var(--font-display)] text-[10px] font-semibold tabular-nums">
            {timeLimitLabel(prompt.timeLimit)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  currentTier,
  loggedIn,
  onSelect,
}: {
  plan: MarketingPlan;
  currentTier: Tier;
  loggedIn: boolean;
  onSelect: (tier: Tier) => void;
}) {
  const isCurrent = loggedIn && currentTier === plan.tier;
  const isPro = plan.tier === "PRO";

  return (
    <div
      className={[
        "relative flex flex-col rounded-xl p-6",
        isPro
          ? "border border-blue-600 bg-blue-950/10"
          : "border border-gray-800 bg-gray-900",
      ].join(" ")}
    >
      {isPro ? (
        <div className="absolute -top-3 left-6 rounded-full border border-blue-500/40 bg-blue-950 px-2.5 py-1 font-[family-name:var(--font-display)] text-[10px] uppercase tracking-widest text-blue-300">
          Most popular
        </div>
      ) : null}

      <div>
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-gray-100">
          {plan.name}
        </h3>
        <p className="mt-3 font-[family-name:var(--font-display)] text-2xl text-white">
          {plan.price}
        </p>
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-400">
            <span className="mt-0.5 text-green-500">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={isCurrent ? undefined : () => onSelect(plan.tier)}
        disabled={isCurrent}
        className={[
          "mt-6 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          isCurrent
            ? "cursor-not-allowed border border-gray-800 bg-transparent text-gray-600"
            : isPro
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "border border-gray-700 bg-transparent text-gray-300 hover:border-gray-500",
        ].join(" ")}
      >
        {isCurrent ? "Current plan" : plan.cta}
      </button>
    </div>
  );
}

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
    <div className="flex min-w-[220px] shrink-0 items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-gray-400">
        {icon}
      </div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-gray-200">
          {label}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{text}</p>
      </div>
    </div>
  );
}

function QuestionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 3v6h8V3" />
      <path d="M8 17h8" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const promptsRef = useRef<HTMLDivElement>(null);
  const cardsVisible = useRef(new Set<number>());
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const { data: session, status } = useSession();
  const setActivePrompt = useSessionStore((s) => s.setActivePrompt);

  const loggedIn = Boolean(session);
  const currentTier = getTier(session?.user?.tier);
  const allPromptsUnlocked = loggedIn && currentTier !== "FREE";

  useEffect(() => {
    const el = promptsRef.current;
    if (!el) return;

    const cards = el.querySelectorAll("[data-prompt-card]");
    if (!cards.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.promptCard);
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

  const handleHeroCta = () => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    scrollToSection("prompts");
  };

  const handlePromptClick = (prompt: DesignPrompt, index: number) => {
    if (!session) {
      router.push("/login");
      return;
    }

    // FREE tier trying to access a pro prompt → send to billing
    if (currentTier === "FREE" && index >= FREE_PROMPT_COUNT) {
      router.push("/billing");
      return;
    }

    const id = nanoid(8);
    setActivePrompt(prompt);
    router.push(`/session/${id}`);
  };

  const handlePricingCta = (tier: Tier) => {
    if (tier === "FREE") {
      if (!session) {
        router.push("/login");
        return;
      }

      scrollToSection("prompts");
      return;
    }

    router.push("/billing");
  };

  const heroPlanText =
    status === "loading"
      ? "Loading account..."
      : !session
        ? "Free account · No credit card · Start in 10 seconds"
        : currentTier === "FREE"
          ? "Free plan · 5 hints per session"
          : currentTier === "PRO"
            ? "Pro plan · Unlimited hints"
            : "Premium plan";

  const promptSubtext = !session
    ? "Sign in for free to start practicing."
    : currentTier === "FREE"
      ? `${FREE_PROMPT_COUNT} questions free · Upgrade for all ${PROMPTS.length}`
      : `All ${PROMPTS.length} questions unlocked.`;

  return (
    <div className="dot-grid flex min-h-screen flex-col bg-gray-950">
      <Navbar onPricingClick={() => scrollToSection("pricing")} />

      <section className="mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:gap-16 lg:px-16 lg:py-28">
        <div className="flex flex-1 flex-col items-start gap-6">
          <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight text-gray-50 lg:text-5xl">
            Practice system design.
            <br />
            <span className="text-blue-500">Get grilled by AI.</span>
          </h1>

          <p className="animate-fade-up delay-200 max-w-xl text-base font-medium leading-relaxed text-gray-200 lg:text-lg">
            Pick a question, draw your architecture with real components —
            PostgreSQL, Redis, Kafka — and an AI interviewer watches your canvas
            in real-time. Label everything, defend your choices, get scored out
            of 100.
          </p>

          <div className="animate-fade-up delay-300 flex flex-col items-start gap-3">
            <button
              type="button"
              onClick={handleHeroCta}
              disabled={status === "loading"}
              className="font-[family-name:var(--font-display)] whitespace-nowrap rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {session ? "Continue Practicing →" : "Start for Free →"}
            </button>
            <p className="font-[family-name:var(--font-display)] text-xs text-gray-500">
              {heroPlanText}
            </p>
          </div>
        </div>

        <div className="animate-fade-up delay-500 flex w-full flex-1 justify-center lg:justify-end">
          <SessionMockup />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          <Step
            num="01"
            title="Pick a question"
            text="Pick a prompt and get to the main path fast."
            icon={<QuestionIcon />}
          />
          <Step
            num="02"
            title="Draw with real components"
            text="Drag vendor-specific icons onto the canvas — PostgreSQL, Redis, Kafka, load balancers. Label every component. The AI reads your diagram structure, not just your chat."
            icon={<BoxArrowIcon />}
          />
          <Step
            num="03"
            title="Get grilled and scored"
            text="The AI asks the questions a senior interviewer would. When you're done, request a score out of 100 with a breakdown across scalability, reliability, tradeoffs, and completeness."
            icon={<ChatIcon />}
          />
        </div>
      </section>

      <section id="prompts" className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-16">
        <div className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-gray-100">
            Choose a question
          </h2>
          <p className="mt-2 font-[family-name:var(--font-display)] text-sm text-gray-500">
            {promptSubtext}
          </p>
        </div>

        <div
          ref={promptsRef}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {PROMPTS.map((prompt, idx) => {
            const isPro = idx >= FREE_PROMPT_COUNT;

            // Determine lock state and messaging based on auth + tier
            let lockedMessage: string | undefined;
            let lockedHref: string | undefined;
            if (isPro) {
              if (!session) {
                lockedMessage = "Sign in to access";
                lockedHref = "/login";
              } else if (currentTier === "FREE") {
                lockedMessage = "Pro plan required";
                lockedHref = "/billing";
              }
              // PRO / PREMIUM: lockedMessage stays undefined → card is unlocked
            }

            const isLocked = Boolean(lockedMessage);
            const interactive = !isLocked;

            return (
              <div key={prompt.id} data-prompt-card={idx}>
                <PromptCard
                  prompt={prompt}
                  index={idx}
                  visible={visibleCards.has(idx)}
                  interactive={interactive}
                  showProBadge={isLocked}
                  lockedMessage={lockedMessage}
                  lockedHref={lockedHref}
                  onClick={() => handlePromptClick(prompt, idx)}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-16">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-gray-100">
            Simple pricing
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.tier}
              plan={plan}
              currentTier={currentTier}
              loggedIn={loggedIn}
              onSelect={handlePricingCta}
            />
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          Cancel anytime. No contracts.
        </p>
      </section>

      <section className="mx-auto w-full max-w-7xl border-t border-gray-800/50 px-6 py-12 lg:px-16">
        <div className="scrollbar-none flex gap-8 overflow-x-auto pb-2 lg:gap-12">
          <Feature
            icon={<ComponentsIcon />}
            label="Vendor-specific components"
            text="PostgreSQL, Redis, Kafka, nginx and more — not just boxes and arrows."
          />
          <Feature
            icon={<DiagramIcon />}
            label="AI that reads your diagram"
            text="The interviewer sees your canvas structure, not just what you type."
          />
          <Feature
            icon={<ScoreIcon />}
            label="Scored out of 100"
            text="Breakdown across scalability, reliability, tradeoffs, and completeness."
          />
          <Feature
            icon={<SaveIcon />}
            label="Saves your progress"
            text="Your diagram and hint history are saved. Pick up where you left off."
          />
        </div>
      </section>

      <footer className="mt-auto border-t border-gray-800/50 px-6 py-6 text-xs text-gray-600 lg:px-16">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <span className="font-[family-name:var(--font-display)] md:justify-self-start">
            SysDraw &copy; 2025
          </span>

          <div className="flex items-center justify-start gap-4 md:justify-center">
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="text-xs text-gray-600 transition-colors hover:text-gray-400"
            >
              Pricing
            </button>
            <Link
              href="/billing"
              className="text-xs text-gray-600 transition-colors hover:text-gray-400"
            >
              Billing
            </Link>
            <a
              href="#"
              className="text-xs text-gray-600 transition-colors hover:text-gray-400"
            >
              GitHub
            </a>
          </div>

          <span className="md:justify-self-end">
            Built with Next.js + Claude API
          </span>
        </div>
      </footer>
    </div>
  );
}
