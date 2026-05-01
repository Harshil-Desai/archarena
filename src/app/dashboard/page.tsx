import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PROMPTS } from "@/lib/prompts";
import { UserNavBar } from "@/components/ui/UserNavBar";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeStreak } from "@/lib/user-meta";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/dashboard");

  const userId = session.user.id;

  const recentSessions = await prisma.interviewSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const allSessions = await prisma.interviewSession.findMany({
    where: { userId },
    select: { hintsUsed: true, scoreResult: true },
  });

  const totalSessions = allSessions.length;
  const scores = allSessions
    .filter(s => s.scoreResult != null)
    .map(s => (s.scoreResult as { overall?: number } | null)?.overall ?? 0)
    .filter(n => n > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const totalHints = allSessions.reduce((sum, s) => sum + s.hintsUsed, 0);

  // Rubric breakdown from scored sessions (last 10)
  const scoredSessions = allSessions
    .filter(s => s.scoreResult != null)
    .slice(0, 10);

  type RubricResult = {
    scalability?: number;
    reliability?: number;
    tradeoffs?: number;
    completeness?: number;
  };

  function avgRubricDimension(key: keyof RubricResult): number {
    if (!scoredSessions.length) return 0;
    const vals = scoredSessions
      .map(s => (s.scoreResult as RubricResult | null)?.[key] ?? 0)
      .filter(n => n > 0);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const rubric = {
    scalability:  avgRubricDimension("scalability"),
    reliability:  avgRubricDimension("reliability"),
    tradeoffs:    avgRubricDimension("tradeoffs"),
    completeness: avgRubricDimension("completeness"),
  };

  const stats = { totalSessions, avgScore, bestScore, totalHints, rubric };
  const streak = await computeStreak(userId);

  const sessionsThisWeek = recentSessions.filter(
    (s) => Date.now() - new Date(s.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  // Daily challenge — picks one prompt deterministically per UTC day
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - Date.UTC(today.getUTCFullYear(), 0, 0)) / 86400000
  );
  const dailyPrompt = PROMPTS[dayOfYear % PROMPTS.length];
  const utcMidnight = Date.UTC(
    today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1, 0, 0, 0
  );
  const msToReset = utcMidnight - today.getTime();
  const resetH = Math.floor(msToReset / 3600000);
  const resetM = Math.floor((msToReset % 3600000) / 60000);
  const resetIn = `${String(resetH).padStart(2, "0")}h ${String(resetM).padStart(2, "0")}m`;
  const dailyDiffClass =
    dailyPrompt.difficulty === "easy" ? "chip-easy" :
    dailyPrompt.difficulty === "medium" ? "chip-med" : "chip-hard";

  return (
    <div style={{ minHeight: "100vh" }}>
      <UserNavBar />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Header */}
        <div className="row between" style={{ marginBottom: 28 }}>
          <div className="col gap-1">
            <span className="eyebrow">Welcome back</span>
            <h1 className="serif" style={{ fontSize: 40, margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>
              {session.user?.name?.split(" ")[0] ?? "Arena"}. <em style={{ color: "var(--text-3)" }}>Your next round awaits.</em>
            </h1>
          </div>
          <div className="row gap-2">
            <Link href="/prompts" className="btn btn-primary">New round <Icon name="arrow-right" size={14} /></Link>
          </div>
        </div>

        {/* Stats row - 4 cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Rounds played", value: stats.totalSessions.toString(), sub: sessionsThisWeek > 0 ? `+${sessionsThisWeek} this week` : "all time", tone: sessionsThisWeek > 0 ? "var(--win)" : "var(--text-4)" },
            { label: "Avg score",     value: stats.avgScore ? stats.avgScore.toString() : "—", sub: "/ 100",    tone: "var(--text-4)" },
            { label: "Best score",    value: stats.bestScore ? stats.bestScore.toString() : "—", sub: "all time", tone: "var(--text-4)" },
            { label: "Hints used",    value: stats.totalHints.toString(),    sub: "total",          tone: "var(--text-4)" },
          ].map(s => (
            <div key={s.label} className="card p-5" style={{ minHeight: 120 }}>
              <div className="eyebrow">{s.label}</div>
              <div className="row gap-2" style={{ alignItems: "baseline", marginTop: 10 }}>
                <span className="mono" style={{ fontSize: 34, color: "var(--text-1)", letterSpacing: "-0.01em" }}>{s.value}</span>
                {s.sub && <span className="mono" style={{ fontSize: 12, color: s.tone }}>{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* CTA + Daily Challenge row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* CTA hero */}
          <div className="card edge-glow" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
            <div className="ambient" style={{ opacity: 0.7 }} />
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", height: "100%" }}>
              <div className="col gap-2">
                <span className="eyebrow">Ready to compete</span>
                <h2 className="serif" style={{ fontSize: 26, margin: 0, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
                  Continue your <em>streak.</em>
                </h2>
                <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: 0, lineHeight: 1.5 }}>
                  Pick any question and start a new round.
                </p>
                <div className="row gap-2" style={{ marginTop: 6 }}>
                  <Link href="/prompts" className="btn btn-primary" style={{ padding: "10px 16px", fontSize: 12.5 }}>
                    Start round <Icon name="arrow-right" size={13} />
                  </Link>
                  <Link href="/history" className="btn btn-ghost" style={{ padding: "10px 14px", fontSize: 12.5 }}>
                    History
                  </Link>
                </div>
              </div>
              <div className="col" style={{ alignItems: "flex-end" }}>
                <div className="mono" style={{ fontSize: 44, color: "var(--text-1)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {streak}<span style={{ color: streak > 0 ? "var(--gold)" : "var(--text-5)", marginLeft: 2 }}>◆</span>
                </div>
                <span className="eyebrow" style={{ marginTop: 4 }}>Day streak</span>
              </div>
            </div>
          </div>

          {/* Daily Challenge */}
          <div className="card p-5">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="col gap-1">
                <span className="eyebrow" style={{ color: "var(--accent)" }}>● Daily challenge</span>
                <h3 className="serif" style={{ fontSize: 22, margin: 0, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                  {dailyPrompt.title}
                </h3>
              </div>
              <div className="col" style={{ alignItems: "flex-end", flexShrink: 0 }}>
                <span className="mono" style={{ fontSize: 16, color: "var(--text-1)", letterSpacing: "0.02em" }}>{resetIn}</span>
                <span className="eyebrow" style={{ marginTop: 2 }}>Resets in</span>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.55, margin: "0 0 14px" }}>
              {dailyPrompt.description}
            </p>
            <div className="row between">
              <div className="row gap-2">
                <span className={`chip ${dailyDiffClass}`}>{dailyPrompt.difficulty}</span>
                <span className="chip">2× elo</span>
                <span className="chip">{Math.round(dailyPrompt.timeLimit / 60)} min</span>
              </div>
              <Link href="/prompts" className="btn btn-soft" style={{ padding: "8px 14px", fontSize: 12 }}>
                Accept <Icon name="bolt" size={12} style={{ color: "var(--gold)" }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          {/* Recent sessions */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="row between" style={{ padding: "16px 18px", borderBottom: "1px solid var(--line-1)" }}>
              <span className="eyebrow">Recent rounds</span>
              <Link href="/history" className="mono" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                See all <Icon name="arrow-right" size={10} />
              </Link>
            </div>
            <div>
              {recentSessions.length === 0 ? (
                <div className="col center" style={{ padding: 40, color: "var(--text-4)", fontSize: 13 }}>
                  No rounds yet — <Link href="/prompts" style={{ color: "var(--accent)", marginLeft: 4 }}>start your first</Link>
                </div>
              ) : (
                recentSessions.map((s) => {
                  const score = s.scoreResult ? (s.scoreResult as { overall?: number })?.overall : null;
                  return (
                    <Link key={s.id} href={`/session/${s.id}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px", borderBottom: "1px solid var(--line-1)",
                      textDecoration: "none",
                    }}>
                      <div className="row gap-4" style={{ flex: 1 }}>
                        <span className="mono" style={{ color: "var(--text-4)", fontSize: 11, width: 52 }}>
                          {new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span style={{ fontSize: 13.5, color: "var(--text-1)", flex: 1 }}>
                          {PROMPTS.find(p => p.id === s.promptId)?.title ?? "Untitled"}
                        </span>
                      </div>
                      <div className="row gap-6" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        <span style={{ color: "var(--text-4)", width: 46 }}>{s.hintsUsed}h</span>
                        <span style={{ color: score != null ? "var(--gold)" : "var(--text-4)" }}>
                          {score != null ? `${score}/100` : "—"}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Rubric + upgrade */}
          <div className="col gap-4">
            <div className="card p-5">
              <div className="row between" style={{ marginBottom: 16 }}>
                <span className="eyebrow">Your rubric</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--text-4)" }}>LAST 10 ROUNDS</span>
              </div>
              <div className="col gap-4">
                <ProgressBar value={stats.rubric.scalability}  label="Scalability" />
                <ProgressBar value={stats.rubric.reliability}  label="Reliability" />
                <ProgressBar value={stats.rubric.tradeoffs}    label="Tradeoffs" />
                <ProgressBar value={stats.rubric.completeness} label="Completeness" />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 18, lineHeight: 1.5 }}>
                Keep practicing to build your rubric breakdown.
              </p>
            </div>

            <div className="card p-5">
              <div className="row between">
                <span className="eyebrow" style={{ color: "var(--gold)" }}>◆ Pro unlock</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--text-4)" }}>FREE</span>
              </div>
              <p className="serif" style={{ fontSize: 22, margin: "10px 0 8px", fontWeight: 400, lineHeight: 1.2 }}>
                Unlimited hints. Full prompt library.
              </p>
              <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: "0 0 14px" }}>
                $12/mo. One onsite loop&apos;s worth of coaching.
              </p>
              <Link href="/pricing" className="btn btn-primary" style={{ width: "100%", display: "flex" }}>
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
