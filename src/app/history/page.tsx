import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PROMPTS } from "@/lib/prompts";
import { UserNavBar } from "@/components/ui/UserNavBar";
import { Icon } from "@/components/ui/Icon";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/history");

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const totalRounds = sessions.length;
  const scores = sessions.filter(s => s.scoreResult).map(s => (s.scoreResult as { overall?: number } | null)?.overall ?? 0);
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const totalHints = sessions.reduce((sum, s) => sum + s.hintsUsed, 0);
  const avgHints = totalRounds ? Math.round(totalHints / totalRounds * 10) / 10 : 0;

  return (
    <div style={{ minHeight: "100vh" }}>
      <UserNavBar />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 24px 60px" }}>
        <div className="col gap-1" style={{ marginBottom: 28 }}>
          <span className="eyebrow">Your archive</span>
          <h1 className="serif" style={{ fontSize: 40, margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>
            Every round <em>remembered.</em>
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total rounds", value: totalRounds.toString() },
            { label: "Best score",   value: bestScore ? `${bestScore}` : "—", sub: bestScore ? "/ 100" : undefined },
            { label: "Avg hints",    value: avgHints.toString(), sub: "/ round" },
            { label: "Total hints",  value: totalHints.toString(), sub: "used" },
          ].map(s => (
            <div key={s.label} className="card p-5" style={{ minHeight: 100 }}>
              <div className="eyebrow">{s.label}</div>
              <div className="row gap-2" style={{ alignItems: "baseline", marginTop: 10 }}>
                <span className="mono" style={{ fontSize: 34, color: "var(--text-1)", letterSpacing: "-0.01em" }}>{s.value}</span>
                {s.sub && <span className="mono" style={{ fontSize: 12, color: "var(--text-4)" }}>{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="row between" style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-1)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-4)" }}>
            <span style={{ letterSpacing: "0.08em" }}>DATE &nbsp;&nbsp;&nbsp; PROMPT</span>
            <span className="row gap-6">
              <span style={{ width: 46 }}>HINTS</span>
              <span style={{ width: 80 }}>SCORE</span>
              <span style={{ width: 46 }}>STATUS</span>
            </span>
          </div>
          {sessions.length === 0 ? (
            <div className="col center" style={{ padding: 60, color: "var(--text-4)", fontSize: 13 }}>
              No rounds yet. <Link href="/prompts" style={{ color: "var(--accent)", marginLeft: 4 }}>Start your first →</Link>
            </div>
          ) : (
            sessions.map(s => {
              const score = s.scoreResult ? (s.scoreResult as { overall?: number } | null)?.overall : null;
              return (
                <Link key={s.id} href={`/session/${s.id}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 20px", borderBottom: "1px solid var(--line-1)",
                  textDecoration: "none",
                }}>
                  <div className="row gap-4" style={{ flex: 1 }}>
                    <span className="mono" style={{ color: "var(--text-4)", fontSize: 11, width: 52, flexShrink: 0 }}>
                      {new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span style={{ fontSize: 13.5, color: "var(--text-1)", flex: 1 }}>
                      {PROMPTS.find(p => p.id === s.promptId)?.title ?? "Untitled"}
                    </span>
                  </div>
                  <div className="row gap-6" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    <span style={{ color: "var(--text-4)", width: 46 }}>{s.hintsUsed}h</span>
                    <span style={{ color: score != null ? "var(--gold)" : "var(--text-4)", width: 80 }}>
                      {score != null ? `${score}/100` : "—"}
                    </span>
                    <span style={{ width: 46, color: s.status === "SCORED" ? "var(--win)" : "var(--text-4)", fontSize: 10 }}>
                      {s.status === "SCORED" ? "DONE" : "IN PROG"}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
