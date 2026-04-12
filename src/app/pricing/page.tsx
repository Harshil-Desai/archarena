import Link from "next/link";
import { Check, X } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";

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
          className="text-sm text-gray-300 transition-colors font-medium"
        >
          Pricing
        </Link>
        <Link
          href="/#faq"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          FAQ
        </Link>
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

// Data Structure
type Feature = {
  name: string;
  included: boolean;
};

type Tier = {
  name: string;
  price: string;
  description: string;
  features: Feature[];
  ctaText: string;
  isPopular?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    description: "Enough to get on the board and feel the pressure.",
    ctaText: "Start Free",
    features: [
      { name: "5 Preset prompts", included: true },
      { name: "5 interviewer hints per session", included: true },
      { name: "1 interviewer mode", included: true },
      { name: "0 Sessions saved", included: false },
      { name: "Session export", included: false },
      { name: "Written review", included: false },
      { name: "Shareable session link", included: false },
      { name: "Saved session history", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$12",
    description: "For candidates who want repetition, history, and fewer caps.",
    ctaText: "Upgrade to Pro",
    isPopular: true,
    features: [
      { name: "15 Preset prompts", included: true },
      { name: "Unlimited interviewer hints", included: true },
      { name: "3 interviewer modes", included: true },
      { name: "10 Sessions saved", included: true },
      { name: "Session export", included: true },
      { name: "Written review", included: true },
      { name: "Shareable session link", included: true },
      { name: "Saved session history", included: true },
    ],
  },
  {
    name: "Premium",
    price: "$29",
    description: "For custom drills, more range, and no storage ceiling.",
    ctaText: "Upgrade to Premium",
    features: [
      { name: "15 + custom preset prompts", included: true },
      { name: "Unlimited interviewer hints", included: true },
      { name: "3 + custom interviewer modes", included: true },
      { name: "Unlimited sessions saved", included: true },
      { name: "Session export", included: true },
      { name: "Written review", included: true },
      { name: "Shareable session link", included: true },
      { name: "Saved session history", included: true },
    ],
  },
];

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`relative flex flex-col p-8 rounded-2xl border bg-gray-900 ${
        tier.isPopular
          ? "border-blue-500/50 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/50"
          : "border-gray-800"
      }`}
    >
      {tier.isPopular && (
        <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-[11px] font-bold tracking-widest uppercase rounded-full shadow-lg">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-50 font-[family-name:var(--font-display)]">
          {tier.name}
        </h3>
        <p className="mt-2 text-sm text-gray-400">{tier.description}</p>
        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            {tier.price}
          </span>
          <span className="text-sm text-gray-500 font-medium">/mo</span>
        </div>
      </div>

      <ul className="flex-1 space-y-4 mb-8">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-5 w-5 text-gray-600 shrink-0" />
            )}
            <span
              className={`text-sm ${
                feature.included ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`w-full py-3.5 px-6 rounded-lg text-sm font-bold transition-all font-[family-name:var(--font-display)] ${
          tier.isPopular
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 active:translate-y-0"
            : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700/50"
        }`}
      >
        {tier.ctaText}
      </button>
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 w-full relative overflow-hidden bg-gray-950 flex flex-col items-center">
        {/* Background glow for the page */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto px-6 py-20 lg:py-28 relative z-10 flex flex-col items-center">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Pick the interview cadence.
            </h1>
            <p className="text-lg text-gray-400">
              Free gets you on the board. Paid plans remove the caps and keep the trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {TIERS.map((tier) => (
              <PricingCard key={tier.name} tier={tier} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
