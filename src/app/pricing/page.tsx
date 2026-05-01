import Link from "next/link";
import { auth } from "@/auth";
import { NavBar } from "@/components/ui/NavBar";
import { Icon } from "@/components/ui/Icon";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    sub: "Get started",
    features: [
      "5 system design prompts",
      "3 AI hints per session",
      "1 score per session",
      "Community leaderboard",
      "Session history",
    ],
    locked: ["Full prompt library (15)", "Unlimited hints", "Voice mode", "Priority AI models", "Recruiter intros"],
    cta: "Start free",
    href: "/dashboard",
    accent: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/mo",
    sub: "Most popular",
    features: [
      "Full prompt library (15 questions)",
      "Unlimited AI hints",
      "Unlimited scoring",
      "Mentor / Grill mode",
      "Rubric breakdown",
      "Priority AI (Claude Sonnet)",
      "Leaderboard ranking",
    ],
    locked: ["Voice mode (beta)", "Recruiter intros"],
    cta: "Upgrade to Pro",
    href: "/billing?plan=pro",
    accent: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$29",
    period: "/mo",
    sub: "For serious candidates",
    features: [
      "Everything in Pro",
      "Voice interview mode",
      "Priority queue hints",
      "Recruiter intro program",
      "Export to PDF",
      "1-on-1 mock sessions",
    ],
    locked: [],
    cta: "Go Premium",
    href: "/billing?plan=premium",
    accent: false,
  },
];

export default async function PricingPage() {
  const session = await auth();
  const tier = ((session?.user as { tier?: string } | undefined)?.tier ?? "FREE").toUpperCase();

  return (
    <div style={{ minHeight: "100vh" }}>
      {session ? (
        <NavBar tier={tier} userName={session.user?.name?.[0] ?? "H"} />
      ) : (
        <div style={{
          position: "sticky", top: 0, zIndex: 40,
          backdropFilter: "blur(18px)",
          background: "color-mix(in oklch, var(--bg-0) 70%, transparent)",
          borderBottom: "1px solid var(--line-1)",
        }}>
          <div className="row between" style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 28px" }}>
            <Link href="/"><span className="serif" style={{ fontSize: 18 }}>Arch<em style={{ color: "var(--accent)" }}>Arena</em></span></Link>
            <div className="row gap-2">
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/dashboard" className="btn btn-primary">Get started <Icon name="arrow-right" size={14} /></Link>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 28px 120px" }}>
        <div className="col center" style={{ marginBottom: 64, textAlign: "center" }}>
          <span className="eyebrow" style={{ marginBottom: 16 }}>Pricing</span>
          <h1 className="serif" style={{ fontSize: 56, margin: 0, letterSpacing: "-0.02em", fontWeight: 400, lineHeight: 1.05 }}>
            Invest in the <em>offer.</em>
          </h1>
          <p style={{ fontSize: 17, color: "var(--text-3)", maxWidth: 520, marginTop: 20, lineHeight: 1.55 }}>
            One onsite loop costs $300+ in prep time. We charge $12.
            Cancel whenever — your history stays.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className={plan.accent ? "card edge-glow" : "card"} style={{ padding: "32px 28px", position: "relative" }}>
              {plan.accent && <div className="ambient" style={{ opacity: 0.5 }} />}
              <div style={{ position: "relative" }}>
                <div className="row between" style={{ marginBottom: 20 }}>
                  <div>
                    <div className="eyebrow">{plan.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 4 }}>{plan.sub}</div>
                  </div>
                  {plan.accent && <span className="chip chip-accent">Popular</span>}
                </div>

                <div className="row gap-1" style={{ alignItems: "baseline", marginBottom: 28 }}>
                  <span className="mono" style={{ fontSize: 48, color: "var(--text-1)", letterSpacing: "-0.02em" }}>{plan.price}</span>
                  <span className="mono" style={{ fontSize: 16, color: "var(--text-4)" }}>{plan.period}</span>
                </div>

                <Link href={plan.href} className={`btn ${plan.accent ? "btn-primary" : "btn-ghost"}`}
                  style={{ width: "100%", marginBottom: 28, display: "flex", padding: "12px 16px" }}>
                  {plan.cta} <Icon name="arrow-right" size={14} />
                </Link>

                <div className="col gap-3">
                  {plan.features.map(f => (
                    <div key={f} className="row gap-2" style={{ fontSize: 13, color: "var(--text-2)" }}>
                      <Icon name="check" size={14} style={{ color: "var(--win)", flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                  {plan.locked.map(f => (
                    <div key={f} className="row gap-2" style={{ fontSize: 13, color: "var(--text-5)" }}>
                      <Icon name="lock" size={14} style={{ flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col center" style={{ marginTop: 64, textAlign: "center" }}>
          <p className="mono" style={{ fontSize: 12, color: "var(--text-4)" }}>
            All plans include SOC2-compliant data handling · Cancel anytime · Questions? hello@archarena.dev
          </p>
        </div>
      </div>
    </div>
  );
}
