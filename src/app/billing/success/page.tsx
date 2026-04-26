"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function BillingSuccessPage() {
  const router = useRouter();
  const { update } = useSession();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    update();

    const interval = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(interval);
          router.replace("/dashboard");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="dot-grid-soft flex min-h-screen items-center justify-center"
      style={{ background: "var(--bg-0)", padding: 24, position: "relative" }}
    >
      <div className="ambient" style={{ maxWidth: 800, margin: "0 auto" }} />
      <div
        className="card edge-glow"
        style={{
          padding: 40,
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          className="row center"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            margin: "0 auto 20px",
            background: "color-mix(in oklch, var(--win) 15%, transparent)",
            border: "1px solid color-mix(in oklch, var(--win) 40%, transparent)",
            color: "var(--win)",
          }}
        >
          <Icon name="check" size={26} strokeWidth={2.2} />
        </div>

        <span className="eyebrow" style={{ color: "var(--win)" }}>Round won</span>
        <h1
          className="serif"
          style={{
            margin: "10px 0 8px",
            fontSize: 36,
            letterSpacing: "-0.02em",
            fontWeight: 400,
            lineHeight: 1.1,
          }}
        >
          Welcome to <em>Pro.</em>
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-3)",
            lineHeight: 1.55,
            margin: "0 0 24px",
          }}
        >
          Your plan is now active. Unlimited hints, full prompt library, priority AI.
        </p>

        <Link
          href="/dashboard"
          className="btn btn-primary"
          style={{ width: "100%", padding: "12px 18px", display: "flex" }}
        >
          Go to dashboard <Icon name="arrow-right" size={14} />
        </Link>

        <p
          className="mono"
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "var(--text-5)",
            letterSpacing: "0.04em",
          }}
        >
          Auto-redirecting in {countdown}s
        </p>
      </div>
    </div>
  );
}
