import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PROMPTS } from "@/lib/prompts";
import { NavBar } from "@/components/ui/NavBar";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/profile");

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scores = sessions.filter(s => s.scoreResult).map(s => (s.scoreResult as any)?.overall ?? 0);
  const totalRounds = sessions.length;
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  const totalHints = sessions.reduce((sum, s) => sum + s.hintsUsed, 0);

  const rubric = {
    scalability:  scores.length ? Math.min(100, Math.round(avgScore * 1.08)) : 0,
    reliability:  scores.length ? Math.min(100, Math.round(avgScore * 0.85)) : 0,
    tradeoffs:    scores.length ? Math.min(100, Math.round(avgScore * 0.97)) : 0,
    completeness: scores.length ? Math.min(100, Math.round(avgScore * 0.92)) : 0,
  };

  const ACHIEVEMENTS = [
    { id: "first-round",  icon: "play",    label: "First Blood",      desc: "Complete your first round",         earned: totalRounds >= 1 },
    { id: "five-rounds",  icon: "chart",   label: "Warming Up",       desc: "Complete 5 rounds",                 earned: totalRounds >= 5 },
    { id: "ten-rounds",   icon: "bolt",    label: "Arena Regular",    desc: "Complete 10 rounds",                earned: totalRounds >= 10 },
    { id: "score-80",     icon: "trophy",  label: "Strong Candidate", desc: "Score 80+ on any prompt",           earned: bestScore >= 80 },
    { id: "score-90",     icon: "sparkles",label: "Staff-Level",      desc: "Score 90+ on any prompt",           earned: bestScore >= 90 },
    { id: "streak-3",     icon: "bolt",    label: "On a Roll",        desc: "3-day practice streak",             earned: false },
    { id: "streak-7",     icon: "spark",   label: "Week Warrior",     desc: "7-day practice streak",             earned: false },
    { id: "hard-prompt",  icon: "shield",  label: "Hard Mode",        desc: "Complete a hard difficulty prompt", earned: sessions.some(s => {
      const prompt = PROMPTS.find(p => p.id === s.promptId);
      return prompt?.difficulty === "hard";
    }) },
  ];

  const name = session.user?.name ?? "Anonymous";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: "100vh" }}>
      <NavBar tier="FREE" userName={initials[0] ?? "H"} />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Profile identity card */}
        <div className="card edge-glow" style={{ padding: 32, marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <div className="ambient" style={{ opacity: 0.6 }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center" }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: 999,
              background: "linear-gradient(135deg, var(--accent), var(--signal))",
              border: "2px solid var(--line-3)",
              display: "grid", placeItems: "center",
              fontFamily: "var(--font-serif)", fontSize: 28, color: "#fff",
            }}>{initials}</div>

            {/* Name + meta */}
            <div className="col gap-2">
              <h1 className="serif" style={{ fontSize: 36, margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>
                {name}
              </h1>
              <div className="row gap-3">
                <span className="mono" style={{ fontSize: 11, color: "var(--text-4)" }}>{session.user?.email}</span>
                <span className="chip chip-accent">FREE TIER</span>
              </div>
            </div>

            {/* Elo rank */}
            <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
              <div className="mono" style={{ fontSize: 40, color: "var(--text-1)", letterSpacing: "-0.02em" }}>—</div>
              <span className="eyebrow">Elo rating</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-5)" }}>Unranked</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Rounds",     value: totalRounds.toString() },
            { label: "Avg score",  value: avgScore ? `${avgScore}` : "—" },
            { label: "Best score", value: bestScore ? `${bestScore}` : "—" },
            { label: "Hints used", value: totalHints.toString() },
            { label: "Streak",     value: "0d" },
          ].map(s => (
            <div key={s.label} className="card-inset p-4" style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 28, color: "var(--text-1)", letterSpacing: "-0.01em" }}>{s.value}</div>
              <div className="eyebrow" style={{ marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Rubric */}
          <div className="card p-5">
            <div className="row between" style={{ marginBottom: 20 }}>
              <span className="eyebrow">Performance rubric</span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--text-4)" }}>ALL ROUNDS</span>
            </div>
            {scores.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.55 }}>
                Complete a scored round to see your rubric breakdown.
              </p>
            ) : (
              <div className="col gap-4">
                <ProgressBar value={rubric.scalability}  label="Scalability" />
                <ProgressBar value={rubric.reliability}  label="Reliability" />
                <ProgressBar value={rubric.tradeoffs}    label="Tradeoffs" />
                <ProgressBar value={rubric.completeness} label="Completeness" />
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="row between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)" }}>
              <span className="eyebrow">Recent activity</span>
              <Link href="/history" className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>All rounds</Link>
            </div>
            {sessions.slice(0, 5).length === 0 ? (
              <div className="col center" style={{ padding: 32, color: "var(--text-4)", fontSize: 13 }}>
                No rounds yet — <Link href="/prompts" style={{ color: "var(--accent)" }}>start one</Link>
              </div>
            ) : (
              sessions.slice(0, 5).map(s => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const score = s.scoreResult ? (s.scoreResult as any)?.overall : null;
                const prompt = PROMPTS.find(p => p.id === s.promptId);
                return (
                  <div key={s.id} className="row between" style={{ padding: "12px 18px", borderBottom: "1px solid var(--line-1)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-2)", flex: 1 }}>
                      {prompt?.title ?? s.promptId}
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: score != null ? "var(--gold)" : "var(--text-4)" }}>
                      {score != null ? `${score}/100` : "—"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="card p-5">
          <div className="row between" style={{ marginBottom: 20 }}>
            <span className="eyebrow">Achievements</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-4)" }}>
              {ACHIEVEMENTS.filter(a => a.earned).length} / {ACHIEVEMENTS.length} earned
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {ACHIEVEMENTS.map(a => (
              <div key={a.id} className="card-inset p-4" style={{ opacity: a.earned ? 1 : 0.4, transition: "opacity .2s" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, marginBottom: 10,
                  border: "1px solid var(--line-2)",
                  background: a.earned ? "var(--accent-soft)" : "var(--bg-3)",
                  display: "grid", placeItems: "center",
                  color: a.earned ? "var(--accent)" : "var(--text-4)",
                }}>
                  <Icon name={a.icon} size={16} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", marginBottom: 4 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.4 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-5" style={{ marginTop: 16, borderColor: "color-mix(in oklch, var(--danger) 30%, var(--line-1))" }}>
          <span className="eyebrow" style={{ color: "var(--danger)" }}>Danger zone</span>
          <div className="row between" style={{ marginTop: 16 }}>
            <div className="col gap-1">
              <div style={{ fontSize: 13, color: "var(--text-1)" }}>Delete account</div>
              <div style={{ fontSize: 12, color: "var(--text-4)" }}>Permanently delete your account and all session data. This cannot be undone.</div>
            </div>
            <button className="btn btn-ghost" style={{ color: "var(--danger)", borderColor: "color-mix(in oklch, var(--danger) 40%, transparent)", flexShrink: 0 }}>
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
