import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

const LEADERBOARD_PREVIEW = [
  { rank: 1, user: "satya.m", elo: 2480 },
  { rank: 2, user: "priya.k", elo: 2411 },
  { rank: 3, user: "hiro.t",  elo: 2388 },
  { rank: 4, user: "neha.j",  elo: 2340 },
];

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left — form */}
      <div className="col center" style={{ padding: 40, position: "relative" }}>
        <div style={{ position: "absolute", top: 28, left: 40 }}>
          <Link href="/"><Logo /></Link>
        </div>
        <div className="col gap-6" style={{ width: 360 }}>
          <div className="col gap-2">
            <span className="eyebrow">Sign in · round 02</span>
            <h1 className="serif" style={{ fontSize: 44, margin: 0, letterSpacing: "-0.02em", fontWeight: 400 }}>
              Welcome <em>back.</em>
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-3)", margin: 0 }}>Pick up where you left off.</p>
          </div>

          <div className="col gap-2">
            <a href="/api/auth/signin/google" className="btn btn-soft" style={{ padding: "13px 16px", justifyContent: "flex-start", textDecoration: "none" }}>
              <Icon name="google" size={16} /> Continue with Google
            </a>
            <a href="/api/auth/signin/github" className="btn btn-soft" style={{ padding: "13px 16px", justifyContent: "flex-start", textDecoration: "none" }}>
              <Icon name="github" size={16} /> Continue with GitHub
            </a>
          </div>

          <div className="row gap-3" style={{ alignItems: "center" }}>
            <span className="tick-line" />
            <span className="mono" style={{ fontSize: 10, color: "var(--text-5)" }}>OR</span>
            <span className="tick-line" />
          </div>

          <div className="col gap-2">
            <label className="eyebrow" style={{ fontSize: 10 }}>Email</label>
            <input
              placeholder="you@company.com"
              style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--text-1)", outline: "none" }}
            />
            <button className="btn btn-primary" style={{ marginTop: 8 }}>
              Send magic link
            </button>
          </div>

          <p style={{ fontSize: 11.5, color: "var(--text-4)", margin: 0, lineHeight: 1.55 }}>
            By continuing you agree to our Terms &amp; Privacy. Your first round is free; no card required.
          </p>
        </div>
      </div>

      {/* Right — ambient leaderboard */}
      <div style={{ position: "relative", borderLeft: "1px solid var(--line-1)", background: "var(--bg-1)", overflow: "hidden" }}>
        <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
        <div className="ambient" />
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 40 }}>
          <div className="card edge-glow" style={{ padding: 28, width: 420, maxWidth: "90%", position: "relative", zIndex: 2, background: "var(--bg-2)" }}>
            <div className="row between" style={{ marginBottom: 18 }}>
              <span className="eyebrow">Live arena</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-4)" }}>#132 · You</span>
            </div>
            <div className="col gap-3">
              {LEADERBOARD_PREVIEW.map(r => (
                <div key={r.rank} className="row between" style={{ padding: "8px 0", borderBottom: "1px dashed var(--line-1)" }}>
                  <div className="row gap-3">
                    <span className="mono" style={{ color: "var(--gold)", fontSize: 12 }}>#{r.rank}</span>
                    <span className="mono" style={{ color: "var(--text-2)", fontSize: 12 }}>{r.user}</span>
                  </div>
                  <span className="mono" style={{ color: "var(--text-3)", fontSize: 12 }}>{r.elo}</span>
                </div>
              ))}
              <div className="row between" style={{ padding: "8px", background: "var(--accent-soft)", borderRadius: 6, marginTop: 4 }}>
                <div className="row gap-3">
                  <span className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>#132</span>
                  <span className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>you</span>
                </div>
                <span className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>1820</span>
              </div>
            </div>
            <p className="serif" style={{ fontStyle: "italic", fontSize: 20, margin: "24px 0 0", color: "var(--text-1)", lineHeight: 1.3 }}>
              &ldquo;Every round earns Elo. The ladder keeps you honest.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
