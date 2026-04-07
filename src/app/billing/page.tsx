"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Plan {
  name: string
  tier: "FREE" | "PRO" | "PREMIUM"
  price: string
  period: string
  features: string[]
  cta: string | null
  variantId: string | undefined | null
}

const PLANS: Plan[] = [
  {
    name: "Free",
    tier: "FREE",
    price: "$0",
    period: "",
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
    period: "/month",
    features: [
      "All 15 questions",
      "Unlimited AI hints",
      "Unlimited scoring",
      "Full session history",
      "PNG export",
    ],
    cta: "Upgrade to Pro",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID,
  },
  {
    name: "Premium",
    tier: "PREMIUM",
    price: "$29",
    period: "/month",
    features: [
      "Everything in Pro",
      "Custom prompts",
      "Custom AI persona",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PREMIUM_VARIANT_ID,
  },
]

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loadingVariant, setLoadingVariant] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?from=/billing")
    }
  }, [router, status])

  if (status === "loading" || status === "unauthenticated") {
    return <LoadingSpinner />
  }

  const currentTier = session?.user.tier ?? "FREE"

  async function handleUpgrade(variantId: string) {
    setLoadingVariant(variantId)
    setError(null)

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      })

      if (!res.ok) {
        throw new Error("checkout_failed")
      }

      const data: { url?: string } = await res.json()

      if (!data.url) {
        throw new Error("No checkout URL")
      }

      window.location.assign(data.url)
    } catch (checkoutError) {
      console.error("[billing] Checkout failed:", checkoutError)
      setError("Checkout could not be started. Please try again.")
    } finally {
      setLoadingVariant(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center rounded-full border border-gray-800 bg-gray-900/70 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-gray-500">
            Billing
          </div>
          <h1 className="mt-5 font-mono text-3xl font-medium text-white">
            Choose your plan
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Current plan:
            <span className="ml-1 font-medium text-white">
              {currentTier}
            </span>
          </p>
        </div>

        {error ? (
          <div className="mx-auto mb-6 max-w-2xl rounded-xl border border-red-800/60 bg-red-950/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === currentTier
            const isLoading =
              plan.variantId !== null && loadingVariant === plan.variantId
            const isUnavailable = plan.cta !== null && !plan.variantId

            return (
              <div
                key={plan.tier}
                className={[
                  "flex flex-col gap-5 rounded-2xl border p-6",
                  isCurrent
                    ? "border-blue-600/70 bg-blue-950/20 shadow-lg shadow-blue-950/20"
                    : "border-gray-800 bg-gray-900/80",
                ].join(" ")}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-medium text-white">
                      {plan.name}
                    </span>
                    {isCurrent ? (
                      <span className="rounded-full border border-blue-800/60 bg-blue-900/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-blue-300">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="font-mono text-3xl text-white">
                      {plan.price}
                    </span>
                    <span className="pb-1 text-sm text-gray-500">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-400"
                    >
                      <span className="mt-0.5 text-green-500">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.cta && plan.variantId && !isCurrent ? (
                  <button
                    onClick={() => handleUpgrade(plan.variantId as string)}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Redirecting..." : plan.cta}
                  </button>
                ) : null}

                {plan.cta && isUnavailable && !isCurrent ? (
                  <div className="w-full rounded-lg border border-gray-800 py-2.5 text-center text-sm text-gray-500">
                    Variant not configured
                  </div>
                ) : null}

                {isCurrent ? (
                  <div className="w-full rounded-lg border border-gray-800 py-2.5 text-center text-sm text-gray-600">
                    Current plan
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 transition-colors hover:text-gray-400"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
    </div>
  )
}
