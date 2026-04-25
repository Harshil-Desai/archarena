import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

// ─── Static data ───────────────────────────────────────────────────

const PROMPTS_SAMPLE = [
  { id: "url-shortener",  title: "URL Shortener",                difficulty: "easy",   time: 25, brief: "Design a service that creates short URLs. Handle 100M links, 10K rps reads.",         topScore: 84 },
  { id: "rate-limiter",   title: "Distributed Rate Limiter",      difficulty: "medium", time: 35, brief: "Rate-limiting for an API gateway: sliding window, per-user and per-IP policies.",     topScore: 78 },
  { id: "chat",           title: "Real-time Chat (WhatsApp-like)", difficulty: "hard",   time: 45, brief: "1-on-1 and group messaging with delivery receipts, typing indicators, offline queue.", topScore: 91 },
  { id: "news-feed",      title: "News Feed (Twitter-like)",       difficulty: "hard",   time: 45, brief: "Home timeline for 300M DAU. Fan-out strategy, ranking, celeb problem.",               topScore: 88 },
  { id: "ride-share",     title: "Ride Sharing Dispatch",          difficulty: "hard",   time: 45, brief: "Match riders to nearby drivers in under 2s. Geo-sharding, surge pricing.",            topScore: 73 },
  { id: "payments",       title: "Payments Ledger",                difficulty: "hard",   time: 45, brief: "ACID ledger for 1M tx/day. Idempotency, double-entry, reconciliation.",               topScore: 69 },
];

const LEADERBOARD = [
  { rank: 1,   user: "satya.m",  score: 97, elo: 2480, trend: "▲",  isYou: false },
  { rank: 2,   user: "priya.k",  score: 95, elo: 2411, trend: "▲",  isYou: false },
  { rank: 3,   user: "hiro.t",   score: 94, elo: 2388, trend: "—",  isYou: false },
  { rank: 4,   user: "neha.j",   score: 92, elo: 2340, trend: "▲",  isYou: false },
  { rank: 5,   user: "alex.c",   score: 90, elo: 2301, trend: "▼",  isYou: false },
  { rank: 132, user: "you",      score: 84, elo: 1820, trend: "▲",  isYou: true  },
];

// ─── Sub-components ─────────────────────────────────────────────────

function LandingNavbar() {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 40,
      backdropFilter: "blur(18px)",
      background: "color-mix(in oklch, var(--bg-0) 70%, transparent)",
      borderBottom: "1px solid var(--line-1)",
    }}>
      <div className="row between" style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 28px" }}>
        <Logo />
        <div className="row gap-6" style={{ fontSize: 13, color: "var(--text-3)" }}>
          <span style={{ cursor: "pointer" }}>How it works</span>
          <span style={{ cursor: "pointer" }}>Prompts</span>
          <span style={{ cursor: "pointer" }}>Leaderboard</span>
          <Link href="/pricing" style={{ cursor: "pointer" }}>Pricing</Link>
        </div>
        <div className="row gap-2">
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
          <Link href="/dashboard" className="btn btn-primary">
            Enter the arena <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function HeroCanvasPreview() {
  return (
    <div className="card edge-glow" style={{
      overflow: "hidden",
      background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)), var(--bg-1)",
      boxShadow: "var(--shadow-soft)",
    }}>
      {/* Browser chrome */}
      <div className="row between" style={{ padding: "10px 14px", borderBottom: "1px solid var(--line-1)", background: "var(--bg-2)" }}>
        <div className="row gap-2">
          <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--danger)", opacity: 0.6 }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--warn)", opacity: 0.6 }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--win)", opacity: 0.6 }} />
          <span className="mono" style={{ marginLeft: 10, fontSize: 10.5, color: "var(--text-4)" }}>archarena.dev/session/874a2e</span>
        </div>
        <div className="row gap-2" style={{ color: "var(--text-4)", fontSize: 10 }}>
          <span className="mono">●</span>
          <span className="mono">LIVE</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", minHeight: 360 }}>
        {/* Canvas */}
        <div className="dot-grid" style={{ position: "relative", padding: 28 }}>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div className="row gap-2">
              <span className="chip chip-hard">HARD</span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>NEWS FEED · 300M DAU</span>
            </div>
            <div className="row gap-2">
              <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>12:43 / 45:00</span>
              <span className="chip-dot" style={{ background: "var(--win)" }} />
            </div>
          </div>

          <svg viewBox="0 0 560 280" style={{ width: "100%", height: 280 }} fill="none">
            <defs>
              <linearGradient id="edge-hero" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0.7" />
                <stop offset="1" stopColor="var(--signal)" stopOpacity="0.7" />
              </linearGradient>
              <marker id="arr-hero" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0 0 L6 3 L0 6 Z" fill="var(--signal)" />
              </marker>
            </defs>
            {/* Client */}
            <g><rect x="18" y="28" width="88" height="56" rx="8" fill="var(--bg-2)" stroke="var(--line-3)"/><text x="62" y="60" textAnchor="middle" fill="var(--text-2)" fontFamily="var(--font-mono)" fontSize="11">Client</text><text x="62" y="74" textAnchor="middle" fill="var(--text-4)" fontFamily="var(--font-mono)" fontSize="9">iOS/Web</text></g>
            {/* Cloudflare */}
            <g><rect x="146" y="28" width="96" height="56" rx="8" fill="var(--bg-2)" stroke="#F38020" strokeOpacity="0.6"/><circle cx="160" cy="44" r="3.5" fill="#F38020"/><text x="196" y="60" textAnchor="middle" fill="var(--text-1)" fontFamily="var(--font-mono)" fontSize="11">Cloudflare</text><text x="196" y="74" textAnchor="middle" fill="var(--text-4)" fontFamily="var(--font-mono)" fontSize="9">edge cache</text></g>
            {/* NGINX */}
            <g><rect x="282" y="28" width="96" height="56" rx="8" fill="var(--bg-2)" stroke="#009639" strokeOpacity="0.6"/><circle cx="296" cy="44" r="3.5" fill="#009639"/><text x="332" y="60" textAnchor="middle" fill="var(--text-1)" fontFamily="var(--font-mono)" fontSize="11">NGINX</text><text x="332" y="74" textAnchor="middle" fill="var(--text-4)" fontFamily="var(--font-mono)" fontSize="9">l7 lb</text></g>
            {/* Feed API */}
            <g><rect x="282" y="116" width="96" height="56" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity="0.8"/><circle cx="296" cy="132" r="3.5" fill="var(--accent)"/><text x="332" y="148" textAnchor="middle" fill="var(--text-1)" fontFamily="var(--font-mono)" fontSize="11">Feed API</text><text x="332" y="162" textAnchor="middle" fill="var(--text-3)" fontFamily="var(--font-mono)" fontSize="9">read-heavy</text></g>
            {/* Redis */}
            <g><rect x="418" y="28" width="124" height="56" rx="8" fill="var(--bg-2)" stroke="#D82C20" strokeOpacity="0.6"/><circle cx="432" cy="44" r="3.5" fill="#D82C20"/><text x="480" y="60" textAnchor="middle" fill="var(--text-1)" fontFamily="var(--font-mono)" fontSize="11">Redis Cluster</text><text x="480" y="74" textAnchor="middle" fill="var(--text-4)" fontFamily="var(--font-mono)" fontSize="9">timeline cache</text></g>
            {/* Kafka */}
            <g><rect x="146" y="116" width="96" height="56" rx="8" fill="var(--bg-2)" stroke="#e5c8a0" strokeOpacity="0.6"/><circle cx="160" cy="132" r="3.5" fill="#e5c8a0"/><text x="196" y="148" textAnchor="middle" fill="var(--text-1)" fontFamily="var(--font-mono)" fontSize="11">Kafka</text><text x="196" y="162" textAnchor="middle" fill="var(--text-4)" fontFamily="var(--font-mono)" fontSize="9">fanout</text></g>
            {/* Postgres */}
            <g><rect x="418" y="116" width="124" height="56" rx="8" fill="var(--bg-2)" stroke="#336791" strokeOpacity="0.7"/><circle cx="432" cy="132" r="3.5" fill="#336791"/><text x="480" y="148" textAnchor="middle" fill="var(--text-1)" fontFamily="var(--font-mono)" fontSize="11">Postgres</text><text x="480" y="162" textAnchor="middle" fill="var(--text-4)" fontFamily="var(--font-mono)" fontSize="9">tweets</text></g>
            {/* Ranker (unlabeled) */}
            <g><rect x="282" y="204" width="96" height="56" rx="8" fill="var(--bg-2)" stroke="var(--line-3)" strokeDasharray="3 3"/><text x="332" y="236" textAnchor="middle" fill="var(--text-3)" fontFamily="var(--font-mono)" fontSize="11" fontStyle="italic">?ranker</text><text x="332" y="250" textAnchor="middle" fill="var(--text-5)" fontFamily="var(--font-mono)" fontSize="9">unlabeled</text></g>
            {/* Edges */}
            <path d="M106 56 L 146 56" stroke="url(#edge-hero)" strokeWidth="1.5" markerEnd="url(#arr-hero)"/>
            <path d="M242 56 L 282 56" stroke="url(#edge-hero)" strokeWidth="1.5" markerEnd="url(#arr-hero)"/>
            <path d="M378 56 L 418 56" stroke="url(#edge-hero)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr-hero)"/>
            <path d="M330 84 L 330 116" stroke="url(#edge-hero)" strokeWidth="1.5" markerEnd="url(#arr-hero)"/>
            <path d="M378 144 L 418 144" stroke="url(#edge-hero)" strokeWidth="1.5" markerEnd="url(#arr-hero)"/>
            <path d="M282 144 L 242 144" stroke="url(#edge-hero)" strokeWidth="1.5" markerEnd="url(#arr-hero)"/>
            <path d="M330 172 L 330 204" stroke="var(--line-3)" strokeWidth="1" strokeDasharray="3 3"/>
            {/* AI annotation */}
            <g><rect x="388" y="204" width="156" height="44" rx="8" fill="var(--bg-3)" stroke="var(--accent)" strokeOpacity="0.35"/><circle cx="402" cy="218" r="3" fill="var(--accent)"/><text x="412" y="222" fill="var(--text-2)" fontFamily="var(--font-mono)" fontSize="9">AI INTERVIEWER</text><text x="398" y="238" fill="var(--text-2)" fontSize="10" fontFamily="var(--font-sans)">How do you rank for the celeb</text><text x="398" y="250" fill="var(--text-2)" fontSize="10" fontFamily="var(--font-sans)">fan-out problem?</text></g>
          </svg>
        </div>

        {/* Chat panel */}
        <div style={{ borderLeft: "1px solid var(--line-1)", background: "var(--bg-1)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="row between">
            <span className="eyebrow">Interviewer</span>
            <span className="row gap-1">
              <span className="chip-dot" style={{ background: "var(--win)" }} />
              <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>MENTOR MODE</span>
            </span>
          </div>
          <div className="card-inset p-3" style={{ fontSize: 12, lineHeight: 1.55, color: "var(--text-2)" }}>
            You&apos;ve drawn a pull-based feed. Walk me through how a user with 100M followers posts — do <em style={{ color: "var(--accent)" }}>all fanouts</em> happen at write-time?
          </div>
          <div style={{ alignSelf: "flex-end", maxWidth: "90%", borderRadius: 10, padding: "8px 12px", background: "var(--accent-soft)", border: "1px solid color-mix(in oklch, var(--accent) 30%, transparent)", fontSize: 12, color: "var(--text-1)" }}>
            Hybrid. Regular users → fan-out on write. Celebs → fan-out on read and merge at query.
          </div>
          <div className="card-inset p-3" style={{ fontSize: 12, lineHeight: 1.55, color: "var(--text-2)" }}>
            Good. At what follower count do you switch?
            <div className="row gap-2" style={{ marginTop: 8, opacity: 0.6 }}>
              <span className="blink" style={{ display: "inline-block", width: 6, height: 12, background: "var(--accent)" }} />
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="card-inset p-3" style={{ borderStyle: "dashed", borderColor: "var(--accent)" }}>
            <div className="row between">
              <span className="eyebrow" style={{ color: "var(--accent)" }}>● Now watching</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-4)" }}>7 nodes · 8 edges</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
              Reading your diagram structure — not just your chat.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section style={{ position: "relative", padding: "96px 28px 60px", maxWidth: 1280, margin: "0 auto" }}>
      <div className="ambient" style={{ maxHeight: 800 }} />
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 56, alignItems: "center" }}>
        <div className="col gap-6">
          <div className="row gap-2">
            <span className="chip">
              <span className="chip-dot" />
              NEW · Mentor mode out now
            </span>
          </div>
          <h1 className="fadeUp serif" style={{
            fontSize: 68, lineHeight: 0.98, margin: 0, letterSpacing: "-0.02em", fontWeight: 400,
          }}>
            Enter the arena for
            <br />
            <em style={{ fontStyle: "italic", color: "var(--text-1)" }}>system design.</em>
          </h1>
          <p style={{ fontSize: 17.5, lineHeight: 1.55, color: "var(--text-3)", maxWidth: 520 }}>
            Draw your architecture on a real whiteboard with vendor-grade components.
            An AI interviewer watches every node and edge in real time — then scores you
            against how a staff engineer would.
          </p>
          <div className="row gap-3" style={{ marginTop: 6 }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "14px 22px", fontSize: 14 }}>
              Start a free round <Icon name="arrow-right" size={14} />
            </Link>
            <Link href="/session/demo" className="btn btn-ghost" style={{ padding: "14px 18px", fontSize: 14 }}>
              <Icon name="play" size={12} /> Watch demo (48s)
            </Link>
          </div>
          <div className="row gap-4" style={{ marginTop: 14, fontSize: 12, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
            <span>↳ No credit card</span>
            <span>↳ 5 free questions</span>
            <span>↳ First round in 10 seconds</span>
          </div>

          <div className="row gap-8" style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--line-1)" }}>
            <div className="col">
              <span className="mono" style={{ fontSize: 26, color: "var(--text-1)" }}>12,408</span>
              <span className="eyebrow">Rounds played</span>
            </div>
            <div className="col">
              <span className="mono" style={{ fontSize: 26, color: "var(--text-1)" }}>82<span style={{ color: "var(--text-4)" }}>/100</span></span>
              <span className="eyebrow">Avg. Pro score</span>
            </div>
            <div className="col">
              <span className="mono" style={{ fontSize: 26, color: "var(--text-1)" }}>38%</span>
              <span className="eyebrow">FAANG offer rate</span>
            </div>
          </div>
        </div>

        <HeroCanvasPreview />
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Pick your prompt",         body: "Choose from 15 preset questions spanning backend, real-time, data, and media systems.",                                              icon: "grid"    },
    { n: "02", title: "Draw with real components", body: "Drag vendor-specific shapes — Postgres, Kafka, Redis — onto the canvas. Label everything.",                                         icon: "cube"    },
    { n: "03", title: "Get grilled live",          body: "The AI interviewer reads your diagram structure and asks the questions a staff engineer would.",                                     icon: "chat"    },
    { n: "04", title: "Earn your rank",            body: "Score out of 100 with a breakdown across scalability, reliability, tradeoffs, and completeness.",                                   icon: "trophy"  },
  ];

  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 28px" }}>
      <div className="row between" style={{ marginBottom: 40 }}>
        <div className="col gap-2">
          <span className="eyebrow">How it works</span>
          <h2 className="serif" style={{ fontSize: 42, margin: 0, letterSpacing: "-0.02em", fontWeight: 400 }}>
            Four rounds to a <em>harder</em> answer.
          </h2>
        </div>
        <div className="mono" style={{ color: "var(--text-4)", fontSize: 11 }}>SECTION · 01 / 04</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--line-2)" }}>
        {steps.map((s, i) => (
          <div key={s.n} className="col gap-4" style={{
            padding: "28px 20px 32px",
            borderRight: i < 3 ? "1px solid var(--line-1)" : "none",
            minHeight: 240,
          }}>
            <div className="row between">
              <span className="mono" style={{ color: "var(--text-4)", fontSize: 11, letterSpacing: "0.08em" }}>{s.n}</span>
              <div style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--line-2)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
                <Icon name={s.icon} size={15} />
              </div>
            </div>
            <h3 className="serif" style={{ fontSize: 22, margin: 0, letterSpacing: "-0.01em", fontWeight: 400, color: "var(--text-1)" }}>
              {s.title}
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-3)", margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromptShowcase() {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 28px" }}>
      <div className="row between" style={{ marginBottom: 32 }}>
        <div className="col gap-2">
          <span className="eyebrow">The roster</span>
          <h2 className="serif" style={{ fontSize: 42, margin: 0, letterSpacing: "-0.02em", fontWeight: 400 }}>
            15 canonical prompts. <em>One arena.</em>
          </h2>
        </div>
        <Link href="/prompts" className="btn btn-ghost">See all prompts <Icon name="arrow-right" size={14} /></Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {PROMPTS_SAMPLE.map((p, i) => (
          <div key={p.id} className="card p-5" style={{ minHeight: 180 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <span className={`chip chip-${p.difficulty === "easy" ? "easy" : p.difficulty === "medium" ? "med" : "hard"}`}>
                {p.difficulty}
              </span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--text-4)" }}>#{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="serif" style={{ fontSize: 22, margin: 0, fontWeight: 400, letterSpacing: "-0.01em" }}>{p.title}</h3>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text-3)", marginTop: 8 }}>{p.brief}</p>
            <div className="row between" style={{ marginTop: 18, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-4)" }}>
              <span>◷ {p.time} min</span>
              <span>TOP <span style={{ color: "var(--gold)" }}>{p.topScore}</span>/100</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Leaderboard() {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div className="col gap-4">
          <span className="eyebrow">Weekly arena</span>
          <h2 className="serif" style={{ fontSize: 42, margin: 0, letterSpacing: "-0.02em", fontWeight: 400 }}>
            Climb the <em>global ladder.</em>
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-3)", maxWidth: 420 }}>
            Every round earns Elo. Top the weekly board for recruiter intros.
            Streaks, percentile, and your best breakdown live on your profile.
          </p>
          <div className="row gap-4" style={{ marginTop: 12 }}>
            <div className="card-inset p-4" style={{ minWidth: 140 }}>
              <div className="mono" style={{ fontSize: 28, color: "var(--text-1)" }}>1820</div>
              <div className="eyebrow" style={{ marginTop: 4 }}>Your Elo</div>
            </div>
            <div className="card-inset p-4" style={{ minWidth: 140 }}>
              <div className="mono" style={{ fontSize: 28, color: "var(--text-1)" }}>#132<span style={{ fontSize: 14, color: "var(--text-4)" }}> / 12k</span></div>
              <div className="eyebrow" style={{ marginTop: 4 }}>Global rank</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="row between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)", background: "var(--bg-2)" }}>
            <span className="eyebrow">Leaderboard · Week 17</span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--text-4)" }}>UPDATED 4m ago</span>
          </div>
          <div style={{ padding: "8px 0" }}>
            {LEADERBOARD.map((r, i) => (
              <div key={r.rank} className="row between" style={{
                padding: "12px 18px",
                background: r.isYou ? "color-mix(in oklch, var(--accent) 10%, transparent)" : "transparent",
                borderTop: r.isYou && i > 0 ? "1px dashed var(--line-2)" : "none",
              }}>
                <div className="row gap-3">
                  <span className="mono" style={{ width: 42, color: r.rank <= 3 ? "var(--gold)" : "var(--text-4)", fontSize: 13 }}>#{r.rank}</span>
                  <span style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: r.isYou ? "linear-gradient(135deg, var(--accent), var(--signal))" : "var(--bg-3)",
                    border: "1px solid var(--line-2)",
                    display: "grid", placeItems: "center",
                    fontFamily: "var(--font-serif)", fontSize: 12, color: "#fff",
                    flexShrink: 0,
                  }}>{r.user[0].toUpperCase()}</span>
                  <span className="mono" style={{ fontSize: 13, color: r.isYou ? "var(--accent)" : "var(--text-2)" }}>
                    {r.user}{r.isYou && <span style={{ color: "var(--text-4)", marginLeft: 6, fontSize: 10 }}>YOU</span>}
                  </span>
                </div>
                <div className="row gap-5">
                  <span className="mono" style={{ fontSize: 13, color: "var(--text-2)" }}>{r.elo}</span>
                  <span className="mono" style={{ fontSize: 12, color: r.trend === "▲" ? "var(--win)" : r.trend === "▼" ? "var(--danger)" : "var(--text-4)", width: 14 }}>{r.trend}</span>
                  <span className="mono" style={{ fontSize: 13, color: "var(--gold)" }}>{r.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { q: "I'd bombed two Meta onsite loops. Twenty rounds here and I cleared the third. The mentor mode catches the exact tradeoff questions the interviewers ask.", name: "Priya K.", role: "E5 @ Meta" },
    { q: "The diagram parser is what sold me — it actually sees your boxes and edges. Every hint felt earned, not scripted.", name: "Hiro T.", role: "Senior SWE @ Stripe" },
    { q: "Cheaper than one hour of a coach and I could grind ten rounds in a weekend. The rank card kept me honest.", name: "Alex C.", role: "Staff eng @ Atlassian" },
  ];
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 28px" }}>
      <div className="row between" style={{ marginBottom: 28 }}>
        <span className="eyebrow">Proof · offers signed</span>
        <div className="row gap-2" style={{ color: "var(--text-4)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
          <span>META</span><span>·</span><span>AMZN</span><span>·</span><span>STRIPE</span><span>·</span><span>GOOG</span><span>·</span><span>ATLASSIAN</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {quotes.map((t, i) => (
          <div key={i} className="card p-5" style={{ minHeight: 200, display: "flex", flexDirection: "column", gap: 16 }}>
            <Icon name="sparkles" size={18} style={{ color: "var(--accent)" }} />
            <p className="serif" style={{ fontSize: 18, lineHeight: 1.45, margin: 0, color: "var(--text-1)" }}>&ldquo;{t.q}&rdquo;</p>
            <div style={{ flex: 1 }} />
            <div className="row between" style={{ paddingTop: 14, borderTop: "1px solid var(--line-1)" }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{t.name}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-4)" }}>{t.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 28px 120px" }}>
      <div className="card edge-glow" style={{ padding: 56, position: "relative", overflow: "hidden" }}>
        <div className="ambient" style={{ inset: "-40% -40% auto auto", width: "60%", height: "200%" }} />
        <div className="col gap-5" style={{ position: "relative", maxWidth: 640 }}>
          <span className="eyebrow">Round 01 · ready</span>
          <h2 className="serif" style={{ fontSize: 56, margin: 0, letterSpacing: "-0.02em", lineHeight: 1, fontWeight: 400 }}>
            Your first round is <em>free.</em><br />
            The ladder is not.
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-3)", margin: 0, maxWidth: 520 }}>
            Practice. Refine. Ship the interview.
          </p>
          <div className="row gap-3" style={{ marginTop: 8 }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "14px 22px" }}>
              Step in <Icon name="arrow-right" size={14} />
            </Link>
            <Link href="/pricing" className="btn btn-ghost" style={{ padding: "14px 18px" }}>
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const sections = [
    { title: "Product",   items: ["Prompts", "Pricing", "Changelog", "Roadmap"] },
    { title: "Resources", items: ["Playbook", "Rubric", "Discord", "Blog"] },
    { title: "Company",   items: ["About", "Careers", "Privacy", "Terms"] },
  ];
  return (
    <footer style={{ borderTop: "1px solid var(--line-1)", padding: "40px 28px 60px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
        <div className="col gap-3">
          <Logo />
          <p style={{ fontSize: 12.5, color: "var(--text-4)", maxWidth: 280, lineHeight: 1.55 }}>
            Practice system design. Get grilled. Ship the interview.
          </p>
        </div>
        {sections.map(s => (
          <div key={s.title} className="col gap-2">
            <span className="eyebrow">{s.title}</span>
            {s.items.map(item => (
              <span key={item} style={{ fontSize: 13, color: "var(--text-3)", cursor: "pointer" }}>{item}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="row between" style={{ maxWidth: 1280, margin: "48px auto 0", paddingTop: 20, borderTop: "1px solid var(--line-1)", color: "var(--text-5)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
        <span>© 2026 ArchArena Labs. All rights reserved.</span>
        <span>v1.4.0 · SOC2 Type II · Built for interviewers.</span>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="dot-grid-soft" style={{ minHeight: "100vh" }}>
      <LandingNavbar />
      <Hero />
      <HowItWorks />
      <PromptShowcase />
      <Leaderboard />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
