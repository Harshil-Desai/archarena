"use client";

import { useSessionStore } from "@/store/session";
import { LIMITS } from "@/lib/limits";

interface ScoreTone {
  label: string;
  text: string;
  fill: string;
}

function scoreTone(score: number): ScoreTone {
  if (score < 50) {
    return {
      label: "needs work",
      text: "var(--danger)",
      fill: "color-mix(in oklch, var(--danger) 75%, transparent)",
    };
  }
  if (score < 75) {
    return {
      label: "promising",
      text: "var(--gold)",
      fill: "color-mix(in oklch, var(--gold) 75%, transparent)",
    };
  }
  return {
    label: "staff-level",
    text: "var(--win)",
    fill: "color-mix(in oklch, var(--win) 75%, transparent)",
  };
}

function BreakdownBar({
  label,
  value,
  fill,
}: {
  label: string;
  value: number;
  fill: string;
}) {
  const max = 25;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div>
      <div className="row between" style={{ marginBottom: 6 }}>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-2)" }}>
          {value}/{max}
        </span>
      </div>
      <div
        className="bar-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: fill,
            borderRadius: 2,
            transition: "width 0.4s ease-out",
          }}
        />
      </div>
    </div>
  );
}

export function ScorePanel() {
  const scoreResult = useSessionStore((s) => s.scoreResult);
  const setScoreResult = useSessionStore((s) => s.setScoreResult);
  const isScoring = useSessionStore((s) => s.isScoring);
  const scoresUsed = useSessionStore((s) => s.scoresUsed);

  const limitReached = scoresUsed >= LIMITS.free.scoresPerSession;

  if (isScoring) {
    return (
      <section style={{ height: "100%" }}>
        <div className="card edge-glow" style={{ padding: 20, height: "100%" }}>
          <div className="row gap-3" style={{ alignItems: "flex-start" }}>
            <div
              className="animate-spin"
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "2px solid var(--line-2)",
                borderTopColor: "var(--accent)",
                flexShrink: 0,
                marginTop: 2,
              }}
              aria-hidden="true"
            />
            <div className="grow">
              <span className="eyebrow" style={{ color: "var(--accent)" }}>
                Running review
              </span>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-1)",
                  margin: "6px 0 0",
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                }}
              >
                The interviewer is grading your design…
              </p>
              <div className="col gap-2" style={{ marginTop: 18 }}>
                <div
                  className="animate-pulse"
                  style={{ height: 8, borderRadius: 4, background: "var(--bg-3)", width: "100%" }}
                />
                <div
                  className="animate-pulse"
                  style={{ height: 8, borderRadius: 4, background: "var(--bg-3)", width: "92%" }}
                />
                <div
                  className="animate-pulse"
                  style={{ height: 8, borderRadius: 4, background: "var(--bg-3)", width: "78%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (scoreResult) {
    if (scoreResult.score === -1) {
      return (
        <section style={{ height: "100%" }}>
          <div
            className="card"
            style={{
              padding: 20,
              height: "100%",
              borderColor: "color-mix(in oklch, var(--danger) 30%, var(--line-1))",
              background: "color-mix(in oklch, var(--danger) 6%, var(--bg-1))",
            }}
          >
            <div
              className="col center"
              style={{ height: "100%", padding: 20, textAlign: "center", gap: 12 }}
            >
              <div style={{ fontSize: 28 }}>⚠️</div>
              <p
                className="serif"
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: "var(--danger)",
                  fontWeight: 500,
                }}
              >
                {scoreResult.isQuotaError ? "Provider limit hit" : "Review failed"}
              </p>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--text-3)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {scoreResult.error}
              </p>
              {scoreResult.isQuotaError && (
                <p
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-4)",
                    fontFamily: "var(--font-mono)",
                    margin: 0,
                  }}
                >
                  Switch providers or wait a minute, then run the review again.
                </p>
              )}
              <button
                onClick={() => setScoreResult(null)}
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--accent)",
                  textDecoration: "underline",
                }}
              >
                Clear and retry
              </button>
            </div>
          </div>
        </section>
      );
    }

    if (!scoreResult.breakdown) return null;

    const tone = scoreTone(scoreResult.score);
    const b = scoreResult.breakdown;

    return (
      <section style={{ height: "100%", overflow: "auto" }}>
        <div className="card edge-glow" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
          <div className="ambient" style={{ opacity: 0.4 }} />
          <div style={{ position: "relative" }}>
            <div className="row between" style={{ alignItems: "flex-start", marginBottom: 24 }}>
              <div className="col gap-1">
                <span className="eyebrow">Final score</span>
                <div
                  className="mono"
                  style={{
                    fontSize: 56,
                    fontWeight: 600,
                    color: tone.text,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    textShadow: `0 0 30px color-mix(in oklch, ${tone.text} 30%, transparent)`,
                  }}
                >
                  {scoreResult.score}
                  <span style={{ color: "var(--text-4)", fontSize: 24, marginLeft: 4 }}>/100</span>
                </div>
              </div>
              <span
                className="chip"
                style={{
                  flexShrink: 0,
                  color: tone.text,
                  borderColor: `color-mix(in oklch, ${tone.text} 35%, transparent)`,
                  background: `color-mix(in oklch, ${tone.text} 10%, var(--bg-2))`,
                }}
              >
                {tone.label}
              </span>
            </div>

            <div className="col gap-4" style={{ marginBottom: 24 }}>
              <BreakdownBar label="Scalability"   value={b.scalability}   fill={tone.fill} />
              <BreakdownBar label="Reliability"   value={b.reliability}   fill={tone.fill} />
              <BreakdownBar label="Tradeoffs"     value={b.tradeoffs}     fill={tone.fill} />
              <BreakdownBar label="Completeness" value={b.completeness} fill={tone.fill} />
            </div>

            <div className="card-inset" style={{ padding: 16, marginBottom: 18 }}>
              <span className="eyebrow" style={{ marginBottom: 8, display: "block" }}>
                Mentor&apos;s note
              </span>
              <p
                className="serif"
                style={{
                  fontStyle: "italic",
                  fontSize: 14,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {scoreResult.feedback}
              </p>
            </div>

            {scoreResult.missedConcepts && scoreResult.missedConcepts.length > 0 && (
              <div>
                <span className="eyebrow" style={{ marginBottom: 10, display: "block" }}>
                  Missed concepts
                </span>
                <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                  {scoreResult.missedConcepts.map((c, i) => (
                    <span
                      key={`${c}-${i}`}
                      className="chip"
                      style={{
                        color: "var(--gold)",
                        borderColor: "color-mix(in oklch, var(--gold) 35%, transparent)",
                        background: "color-mix(in oklch, var(--gold) 10%, var(--bg-2))",
                        textTransform: "none",
                        letterSpacing: "0",
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ height: "100%" }}>
      <div className="card" style={{ padding: 20, height: "100%" }}>
        <div className="col center" style={{ height: "100%" }}>
          <div
            style={{
              borderRadius: 14,
              border: "1px dashed var(--line-2)",
              padding: 20,
              background: "color-mix(in oklch, var(--bg-2) 40%, transparent)",
              width: "100%",
            }}
          >
            <p
              className="serif"
              style={{
                fontSize: 16,
                color: "var(--text-2)",
                textAlign: "center",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              Run review when the main path is on the board.
            </p>
            {limitReached ? (
              <div
                style={{
                  marginTop: 18,
                  borderRadius: 10,
                  padding: 14,
                  background: "color-mix(in oklch, var(--gold) 12%, transparent)",
                  border: "1px solid color-mix(in oklch, var(--gold) 35%, transparent)",
                  color: "var(--text-1)",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>
                  Free plan gets {LIMITS.free.scoresPerSession} review per session.
                </div>
                <div style={{ marginBottom: 12, fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.55 }}>
                  Start a fresh session for another pass, or upgrade for unlimited reviews.
                </div>
                <a
                  href="/billing"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    background: "var(--gold)",
                    color: "#1a1a1a",
                    textDecoration: "none",
                  }}
                >
                  Upgrade to Pro →
                </a>
              </div>
            ) : (
              <div
                className="mono"
                style={{
                  marginTop: 18,
                  borderRadius: 10,
                  border: "1px solid var(--line-2)",
                  background: "var(--bg-2)",
                  padding: "10px 12px",
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--text-2)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Press &ldquo;Run Review&rdquo; in header
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
