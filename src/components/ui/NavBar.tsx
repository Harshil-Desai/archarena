"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { useTheme } from "./ThemeProvider";

interface NavBarProps {
  tier?: string;
  streak?: number;
  userName?: string;
}

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/prompts",   label: "Prompts",   icon: "grid" },
  { href: "/history",   label: "History",   icon: "history" },
  { href: "/pricing",   label: "Pricing",   icon: "trophy" },
] as const;

export function NavBar({ tier = "FREE", streak = 7, userName = "H" }: NavBarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 40,
      backdropFilter: "blur(18px)",
      background: "color-mix(in oklch, var(--bg-0) 75%, transparent)",
      borderBottom: "1px solid var(--line-1)",
    }}>
      <div className="row between" style={{ maxWidth: 1440, margin: "0 auto", padding: "14px 24px" }}>
        <div className="row gap-6">
          <Link href="/dashboard"><Logo /></Link>
          <div className="row gap-1" style={{ marginLeft: 12 }}>
            {TABS.map(t => {
              const active = pathname.startsWith(t.href);
              return (
                <Link key={t.href} href={t.href} style={{
                  padding: "7px 12px", borderRadius: 8, fontSize: 13,
                  color: active ? "var(--text-1)" : "var(--text-3)",
                  background: active ? "var(--bg-2)" : "transparent",
                  border: active ? "1px solid var(--line-2)" : "1px solid transparent",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  textDecoration: "none",
                }}>
                  <Icon name={t.icon} size={14} />
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="row gap-3">
          <div className="row gap-2 hairline" style={{ padding: "5px 10px", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
            <span style={{ color: "var(--gold)" }}>◆</span>
            <span>{streak}d streak</span>
          </div>
          <div className="row gap-2 hairline" style={{ padding: "5px 10px", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)" }}>
            <span className="chip-dot" />
            {tier} TIER
          </div>
          <button onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: "1px solid var(--line-2)", background: "var(--bg-2)",
              display: "grid", placeItems: "center", color: "var(--text-2)",
            }}>
            <Icon name={theme === "dark" ? "moon" : "sun"} size={14} />
          </button>
          <Link href="/profile" style={{
            width: 30, height: 30, borderRadius: 999,
            background: "linear-gradient(135deg, var(--accent), var(--signal))",
            border: "1px solid var(--line-3)",
            display: "grid", placeItems: "center",
            fontFamily: "var(--font-serif)", fontSize: 14, color: "#fff",
            textDecoration: "none",
          }}>
            {userName[0]?.toUpperCase() ?? "H"}
          </Link>
        </div>
      </div>
    </div>
  );
}
