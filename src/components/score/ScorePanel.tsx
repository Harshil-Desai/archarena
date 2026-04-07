"use client";

import { useSessionStore } from "@/store/session";
import { LIMITS } from "@/lib/limits";

function scoreTone(score: number) {
  if (score < 50) {
    return {
      label: "red",
      scoreText: "text-red-400",
      ring: "ring-red-500/30",
      fill: "bg-red-500/60",
    };
  }

  if (score < 75) {
    return {
      label: "amber",
      scoreText: "text-amber-300",
      ring: "ring-amber-500/30",
      fill: "bg-amber-400/60",
    };
  }

  return {
    label: "green",
    scoreText: "text-emerald-300",
    ring: "ring-emerald-500/30",
    fill: "bg-emerald-400/60",
  };
}

function BreakdownBar({
  label,
  value,
  toneFillClass,
}: {
  label: string;
  value: number;
  toneFillClass: string;
}) {
  const max = 25;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-300">{label}</span>
        <span className="text-xs text-gray-400 tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div
        className="h-2.5 rounded-full bg-gray-800 border border-gray-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full ${toneFillClass}`}
          style={{ width: `${pct}%` }}
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
  const upgradeLinkClasses =
    "bg-amber-600 text-white px-3 py-1 rounded text-xs hover:opacity-90 transition-opacity";

  if (isScoring) {
    return (
      <section className="bg-gray-950">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-full">
          <div className="flex items-center gap-3">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-emerald-400"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-gray-200">
                Running review...
              </p>
              <div className="mt-3 space-y-2">
                <div className="h-2 bg-gray-800 rounded animate-pulse w-full" />
                <div className="h-2 bg-gray-800 rounded animate-pulse w-11/12" />
                <div className="h-2 bg-gray-800 rounded animate-pulse w-9/12" />
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
        <section className="bg-gray-950">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-full">
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="text-2xl mb-3">⚠️</div>
              <p className="text-red-400 text-sm font-medium">
                {scoreResult.isQuotaError 
                  ? 'Provider limit hit' 
                  : 'Review failed'}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {scoreResult.error}
              </p>
              {scoreResult.isQuotaError && (
                <p className="text-gray-500 text-xs mt-3">
                  Switch providers or wait a minute, then run the review again.
                </p>
              )}
              <button
                onClick={() => setScoreResult(null)}
                className="mt-4 text-xs text-blue-400 hover:text-blue-300 underline"
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
      <section className="bg-gray-950">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Score
              </p>
              <div
                className={[
                  "text-5xl font-semibold tabular-nums",
                  tone.scoreText,
                  "leading-none",
                  "drop-shadow-[0_0_18px_rgba(0,0,0,0.6)]",
                ].join(" ")}
              >
                {scoreResult.score}/100
              </div>
            </div>
            <div
              className={[
                "shrink-0 rounded-xl border border-gray-800 px-3 py-2",
                "bg-gray-950 text-sm text-gray-300",
                tone.ring,
              ].join(" ")}
              aria-label="Scoring status"
            >
              {tone.label.toUpperCase()}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <BreakdownBar
              label="Scalability"
              value={b.scalability}
              toneFillClass={tone.fill}
            />
            <BreakdownBar
              label="Reliability"
              value={b.reliability}
              toneFillClass={tone.fill}
            />
            <BreakdownBar
              label="Tradeoffs"
              value={b.tradeoffs}
              toneFillClass={tone.fill}
            />
            <BreakdownBar
              label="Completeness"
              value={b.completeness}
              toneFillClass={tone.fill}
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-gray-200 mb-1">
              Feedback
            </p>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
              {scoreResult.feedback}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-gray-200 mb-2">
              Missed concepts
            </p>
            <div className="flex flex-wrap gap-2">
              {(scoreResult.missedConcepts || []).map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-900/20 border border-amber-700/50 text-amber-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-full">
        <div className="h-full flex flex-col items-stretch justify-center">
          <div className="border border-dashed border-gray-800 rounded-xl p-4 bg-gray-950/20">
            <p className="text-sm text-gray-300 text-center">
              Run review when the main path is on the board.
            </p>
            {limitReached ? (
              <div className="mt-4 bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 text-amber-200 text-sm">
                <div className="font-semibold mb-2">
                  Free plan gets {LIMITS.free.scoresPerSession} review per session.
                </div>
                <div className="mb-3">
                  <div>Start a fresh session for another pass, or</div>
                  <div>upgrade for unlimited reviews.</div>
                </div>
                <a href="/billing" className={upgradeLinkClasses}>
                  Upgrade to Pro →
                </a>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950 text-sm text-gray-200 px-3 py-2 text-center">
                Run Review
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
