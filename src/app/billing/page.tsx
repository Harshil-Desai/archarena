"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import { Icon } from "@/components/ui/Icon";

interface Plan {
  name: string;
  tier: "FREE" | "PRO" | "PREMIUM";
  price: string;
  period: string;
  sub: string;
  features: string[];
  cta: string | null;
  variantId: string | undefined | null;
  accent?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    tier: "FREE",
    price: "$0",
    period: "",
    sub: "Get started",
    features: [
      "5 system design questions",
      "5 AI hints per session",
      "1 score per session",
      "No session history",
    ],
    cta: null,
    variantId: null,
  },
  {
    name: "Pro",
    tier: "PRO",
    price: "$12",
    period: "/mo",
    sub: "Most popular",
    features: [
      "All 15 questions",
      "Unlimited AI hints",
      "Unlimited scoring",
      "Full session history",
      "PNG export",
    ],
    cta: "Upgrade to Pro",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID,
    accent: true,
  },
  {
    name: "Premium",
    tier: "PREMIUM",
    price: "$29",
    period: "/mo",
    sub: "For serious candidates",
    features: [
      "Everything in Pro",
      "Custom prompts",
      "Custom AI persona",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PREMIUM_VARIANT_ID,
  },
];

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingVariant, setLoadingVariant] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?from=/billing");
    }
  }, [router, status]);

  if (status === "loading" || status === "unauthenticated") {
    return <LoadingSpinner />;
  }

  const currentTier = session?.user.tier ?? "FREE";

  async function handleUpgrade(variantId: string) {
    setLoadingVariant(variantId);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      if (!res.ok) {
        throw new Error("checkout_failed");
      }

      const data: { url?: string } = await res.json();

      if (!data.url) {
        throw new Error("No checkout URL");
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      console.error("[billing] Checkout failed:", checkoutError);
      setError("Checkout could not be started. Please try again.");
    } finally {
      setLoadingVariant(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <NavBar tier={currentTier} userName={session?.user?.name?.[0] ?? "H"} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 100px" }}>
        <div className="col center" style={{ marginBottom: 48, textAlign: "center" }}>
          <span className="eyebrow" style={{ marginBottom: 14 }}>Billing</span>
          <h1
            className="serif"
            style={{
              margin: 0,
              fontSize: 48,
              letterSpacing: "-0.02em",
              fontWeight: 400,
              lineHeight: 1.05,
            }}
          >
            Choose your <em>plan.</em>
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: "var(--text-3)",
              marginTop: 14,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
            }}
          >
            CURRENT PLAN ·{" "}
            <span style={{ color: "var(--accent)", fontWeight: 500 }}>{currentTier}</span>
          </p>
        </div>

        {error && (
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto 24px",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 13,
              background: "color-mix(in oklch, var(--danger) 10%, transparent)",
              border: "1px solid color-mix(in oklch, var(--danger) 35%, transparent)",
              color: "var(--text-1)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            const isLoading = plan.variantId !== null && loadingVariant === plan.variantId;
            const isUnavailable = plan.cta !== null && !plan.variantId;

            const cardClass = isCurrent || plan.accent ? "card edge-glow" : "card";

            return (
              <div
                key={plan.tier}
                className={cardClass}
                style={{ padding: "32px 28px", position: "relative" }}
              >
                {(isCurrent || plan.accent) && <div className="ambient" style={{ opacity: 0.4 }} />}
                <div style={{ position: "relative" }}>
                  <div className="row between" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="eyebrow">{plan.name}</div>
                      <div
                        className="mono"
                        style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 4 }}
                      >
                        {plan.sub}
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="chip chip-accent">Current</span>
                    ) : plan.accent ? (
                      <span className="chip chip-accent">Popular</span>
                    ) : null}
                  </div>

                  <div
                    className="row gap-1"
                    style={{ alignItems: "baseline", marginBottom: 24 }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 48,
                        color: "var(--text-1)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {plan.price}
                    </span>
                    <span className="mono" style={{ fontSize: 16, color: "var(--text-4)" }}>
                      {plan.period}
                    </span>
                  </div>

                  {plan.cta && plan.variantId && !isCurrent ? (
                    <button
                      onClick={() => handleUpgrade(plan.variantId as string)}
                      disabled={isLoading}
                      className={plan.accent ? "btn btn-primary" : "btn btn-ghost"}
                      style={{
                        width: "100%",
                        marginBottom: 24,
                        padding: "12px 16px",
                        opacity: isLoading ? 0.6 : 1,
                        cursor: isLoading ? "not-allowed" : "pointer",
                        display: "flex",
                      }}
                    >
                      {isLoading ? "Redirecting…" : plan.cta}
                      {!isLoading && <Icon name="arrow-right" size={14} />}
                    </button>
                  ) : null}

                  {plan.cta && isUnavailable && !isCurrent ? (
                    <div
                      className="mono"
                      style={{
                        width: "100%",
                        marginBottom: 24,
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--line-2)",
                        textAlign: "center",
                        fontSize: 12,
                        color: "var(--text-5)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Variant not configured
                    </div>
                  ) : null}

                  {isCurrent ? (
                    <div
                      className="mono"
                      style={{
                        width: "100%",
                        marginBottom: 24,
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid color-mix(in oklch, var(--accent) 35%, transparent)",
                        background: "var(--accent-soft)",
                        textAlign: "center",
                        fontSize: 12,
                        color: "var(--accent)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Your current plan
                    </div>
                  ) : null}

                  {!plan.cta && !isCurrent ? (
                    <Link
                      href="/dashboard"
                      className="btn btn-ghost"
                      style={{
                        width: "100%",
                        marginBottom: 24,
                        padding: "12px 16px",
                        display: "flex",
                      }}
                    >
                      Continue free
                    </Link>
                  ) : null}

                  <div className="col gap-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="row gap-2"
                        style={{ fontSize: 13, color: "var(--text-2)", alignItems: "flex-start" }}
                      >
                        <Icon
                          name="check"
                          size={14}
                          style={{ color: "var(--win)", flexShrink: 0, marginTop: 2 }}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="row center" style={{ marginTop: 48 }}>
          <button
            onClick={() => router.back()}
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--text-4)",
              letterSpacing: "0.04em",
              transition: "color .15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-4)";
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--bg-0)" }}
    >
      <div
        className="animate-spin"
        style={{
          height: 22,
          width: 22,
          borderRadius: "50%",
          border: "2px solid var(--line-2)",
          borderTopColor: "var(--accent)",
        }}
      />
    </div>
  );
}
