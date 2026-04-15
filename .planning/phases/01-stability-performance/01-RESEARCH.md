# Phase 1: Stability & Performance - Research

**Researched:** 2026-04-15
**Domain:** Canvas performance, API latency, AI cost control, connection pooling
**Confidence:** HIGH

## Summary

Phase 1 addresses four concrete problems: (1) canvas save storms from tldraw's high-frequency store events exhausting Supabase connections, (2) slow page loads from an unoptimized Next.js bundle that includes tldraw eagerly, (3) AI API responses that can exceed 10 seconds under load, and (4) uncontrolled AI token costs. The codebase already has partial mitigations (1.5s debounce in InterviewCanvas, truncation in ai.ts) but they are insufficient or have bugs.

**Primary recommendation:** Fix the two-layer debounce problem (InterviewCanvas at 1.5s fires snapshot changes that trigger a second 3s debounce in SessionPage -- both are too aggressive under load), optimize `hasGraphChanged()` away from JSON.stringify, fix the Gemini model misconfiguration, and add `next/dynamic` for tldraw.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAB-01 | Canvas ops without crashes under 50 concurrent users | Debounce fix, connection pooling, hasGraphChanged optimization |
| STAB-02 | Session save events debounced to prevent connection exhaustion | Two-layer debounce consolidation, IndexedDB-first saves |
| STAB-03 | Page load under 3s on 4G | Dynamic import of tldraw, bundle analysis, image optimization |
| STAB-04 | Hint/score API responses under 10s | Model routing fix, streaming optimization, retry logic |
| AICOST-01 | Voice transcript limited to 200 tokens max | Token counting utility, truncation before prompt injection |
| AICOST-02 | Semantic graph context limited to essential shapes + labels | Already implemented in ai.ts LIMITS_AI -- verify sufficiency |
| AICOST-03 | Hint endpoint uses Haiku/Flash | Already correct in MODEL_MAP -- verify routes use it |
| AICOST-04 | Score endpoint uses Sonnet (cost-controlled) | Gemini GEMINI_MODEL_MAP.pro is misconfigured as flash -- must fix |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Canvas debouncing | Browser / Client | -- | tldraw events are client-side; debounce before any network call |
| Connection pooling | Database / Storage | API / Backend | Supabase PgBouncer config + Prisma connection limits |
| Page load optimization | CDN / Static + Frontend Server | -- | Bundle splitting, dynamic imports, SSR optimization |
| AI cost control | API / Backend | -- | Token truncation and model selection happen server-side |
| Graph diff optimization | Browser / Client | -- | hasGraphChanged runs client-side on every store event |

## Standard Stack

### Core (already in place)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 16.2.1 | App Router, SSR, API routes | Installed [VERIFIED: package.json] |
| tldraw | 4.5.3 | Canvas rendering | Installed [VERIFIED: package.json] |
| Prisma | 7.6.0 | ORM + connection management | Installed [VERIFIED: package.json] |
| @anthropic-ai/sdk | 0.80.0 | Claude API | Installed [VERIFIED: package.json] |

### Additions for Phase 1
| Library | Purpose | Why |
|---------|---------|-----|
| @next/bundle-analyzer | Bundle size analysis | Identify tldraw chunk size, find code-split opportunities [ASSUMED] |

No new runtime dependencies needed. This phase is about fixing what exists.

## Architecture Patterns

### Pattern 1: Consolidated Debounce with IndexedDB-First Save

**What:** Replace the current two-layer debounce (1.5s in InterviewCanvas + 3s in SessionPage) with a single debounce strategy. Save to IndexedDB immediately on every meaningful change, batch DB writes on a longer interval.

**Current problem (verified from source):**
- `InterviewCanvas.tsx:19` -- `DEBOUNCE_MS = 1500` debounces the store listener
- `session/[id]/page.tsx:266` -- `scheduleCanvasSave` adds another 3000ms debounce
- Both fire `onSnapshotChange` which calls `editor.getSnapshot().document` (expensive) [VERIFIED: InterviewCanvas.tsx:96]
- `hasGraphChanged()` uses `JSON.stringify` comparison on every invocation [VERIFIED: graph-parser.ts:280]

**Fix pattern:**
```typescript
// Replace JSON.stringify diff with shallow check
export function hasGraphChanged(
  prev: SemanticGraph | null,
  next: SemanticGraph
): boolean {
  if (!prev) return true
  if (prev.nodes.length !== next.nodes.length) return true
  if (prev.edges.length !== next.edges.length) return true
  // Only deep-compare when counts match (rare during active drawing)
  if (prev.nodes.some((n, i) => n.id !== next.nodes[i]?.id)) return true
  if (prev.edges.some((e, i) => e.id !== next.edges[i]?.id)) return true
  // Check labels changed
  if (prev.nodes.some((n, i) => n.label !== next.nodes[i]?.label)) return true
  return false
}
```

**Debounce consolidation:**
- InterviewCanvas DEBOUNCE_MS: increase from 1500 to 2000ms (graph change detection)
- SessionPage scheduleCanvasSave: increase from 3000 to 5000ms (DB persist)
- Add immediate IndexedDB save on every graph change (cheap, local)
- Add circuit breaker: skip DB save if previous save is still in-flight

### Pattern 2: Dynamic Import for tldraw

**What:** tldraw is a large library (~500KB+ gzipped). Currently imported eagerly. Dynamic import defers it until the session page is actually needed.

```typescript
// In session/[id]/page.tsx
import dynamic from 'next/dynamic'

const InterviewCanvas = dynamic(
  () => import('@/components/canvas/InterviewCanvas').then(m => ({ default: m.InterviewCanvas })),
  { ssr: false, loading: () => <CanvasLoadingSkeleton /> }
)
```
[ASSUMED -- tldraw bundle size estimate; verify with bundle analyzer]

### Pattern 3: Fix Gemini Model Misconfiguration

**What:** `GEMINI_MODEL_MAP.pro` is set to `"gemini-2.5-flash"` instead of `"gemini-2.5-pro"`. This means scoring via Gemini uses the cheap model, violating CLAUDE.md and AICOST-04.

```typescript
// src/lib/ai.ts:80-83 -- CURRENT (broken)
export const GEMINI_MODEL_MAP = {
  flash: "gemini-2.5-flash",
  pro: "gemini-2.5-flash",  // BUG: should be pro
} as const;

// FIX:
export const GEMINI_MODEL_MAP = {
  flash: "gemini-2.5-flash",
  pro: "gemini-2.5-pro",
} as const;
```
[VERIFIED: ai.ts:80-83]

### Anti-Patterns to Avoid
- **JSON.stringify for diff comparison:** O(n) serialization on every store event. Use structural comparison instead. [VERIFIED: graph-parser.ts:280]
- **Nested debounce layers:** Two independent debounce timers create unpredictable save timing. Consolidate to one.
- **Eager tldraw import:** Blocks initial page load for all pages, not just canvas.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundle analysis | Manual webpack inspection | @next/bundle-analyzer | Visualizes chunk sizes automatically |
| Token counting | Character-based estimation | Simple word/4 heuristic or tiktoken-lite | Accurate enough for budget enforcement |
| Connection pooling | Custom pool manager | Supabase PgBouncer + Prisma connection_limit | Already available in infrastructure |

## Common Pitfalls

### Pitfall 1: Canvas Save Storm Under Concurrent Load
**What goes wrong:** 50 users each generating store events at 100+/sec. Even with debounce, 50 users x 1 save/3sec = ~17 DB writes/sec sustained.
**How to avoid:** IndexedDB-first saves. DB saves batched at 5s intervals. Circuit breaker stops DB saves if 3 consecutive fail. Connection pool sized to handle burst.
**Warning signs:** Supabase dashboard showing connection count near limit.

### Pitfall 2: tldraw getSnapshot() is Expensive
**What goes wrong:** `editor.getSnapshot().document` serializes the entire store. Called on every debounced event even if nothing meaningful changed.
**How to avoid:** Only call getSnapshot() AFTER hasGraphChanged() confirms a real change. Currently the code calls getSnapshot() first, then checks the graph. Reverse the order.
[VERIFIED: InterviewCanvas.tsx:94-101 -- snapshot computed before diff check]

### Pitfall 3: Daily Limit Reset Race Condition
**What goes wrong:** Two concurrent requests both read `dailyHintsUsed`, both see it under limit, both increment. User gets one extra hint.
**How to avoid:** Use Prisma's atomic increment with a WHERE clause: `UPDATE ... SET dailyHintsUsed = dailyHintsUsed + 1 WHERE dailyHintsUsed < limit`.
[VERIFIED: daily-limits.ts uses separate read then increment -- not atomic]

### Pitfall 4: Gemini Scoring Uses Wrong Model
**What goes wrong:** GEMINI_MODEL_MAP.pro maps to flash, producing lower quality scores via Gemini.
**How to avoid:** Fix the mapping. Add a startup validation that asserts model names contain expected substrings.
[VERIFIED: ai.ts:82]

## Code Examples

### Atomic Daily Limit Check (fix for race condition)
```typescript
// Replace separate read + increment with atomic operation
const result = await prisma.user.updateMany({
  where: {
    id: userId,
    dailyHintsUsed: { lt: dailyLimit },
  },
  data: {
    dailyHintsUsed: { increment: 1 },
  },
})
const allowed = result.count > 0
```
[ASSUMED -- Prisma updateMany returns count; verify API]

### Reversed Snapshot Order (fix for Pitfall 2)
```typescript
// InterviewCanvas CanvasWatcher -- compute graph FIRST, snapshot ONLY if changed
debounceRef.current = setTimeout(() => {
  const records = Object.values(editor.store.allRecords()) as TLRecord[]
  const graph = parseCanvasToGraph(records)

  if (hasGraphChanged(lastGraphRef.current, graph)) {
    // Only now compute the expensive snapshot
    const snapshot = editor.getSnapshot().document
    onSnapshotChange?.(snapshot)
    lastGraphRef.current = graph
    onCanvasRecordsChange?.(records)
    onGraphChange(graph)
  }
}, DEBOUNCE_MS)
```

### Token Budget Utility for Voice Transcripts (AICOST-01)
```typescript
const MAX_VOICE_TOKENS = 200
// Rough estimation: 1 token ~ 4 chars for English
export function truncateToTokenBudget(text: string, maxTokens: number = MAX_VOICE_TOKENS): string {
  const maxChars = maxTokens * 4
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars).trimEnd() + '...'
}
```
[ASSUMED -- 4 chars/token is a rough heuristic for English text]

## Supabase Connection Pooling

Supabase provides PgBouncer by default on port 6543. The current `DATABASE_URL` must use the pooled connection string for production.

**Key settings for 50 concurrent users:**
- Supabase free tier: 60 direct connections, pooled via PgBouncer
- Prisma `connection_limit` in DATABASE_URL query params: set to 10 (per serverless function instance)
- Use `?pgbouncer=true&connection_limit=10` in DATABASE_URL

[ASSUMED -- Supabase free tier connection limits; verify in Supabase dashboard]

**Action:** Verify the current DATABASE_URL uses the pooled connection string (port 6543, not 5432).

## Page Load Optimization (STAB-03: 3s on 4G)

**Approach:**
1. **Dynamic import tldraw** -- only load on session page, not globally
2. **Analyze bundle** -- install @next/bundle-analyzer, identify top chunks
3. **Preload critical CSS** -- Tailwind purges unused styles by default
4. **Optimize images** -- use next/image if any images exist
5. **Check for unnecessary client-side JS** -- ensure pages that don't need interactivity are server components

**4G baseline:** ~1.5 Mbps download. For 3s target, total transfer budget is ~562 KB. tldraw alone may exceed this if not code-split.

[ASSUMED -- 4G speed estimate; real performance varies]

## AI Cost Management

**Current state (verified):**
- `truncateGraphForAI`: 20 nodes, 30 edges, 5 annotations [VERIFIED: ai.ts:7-16]
- `truncateHistoryForAI`: 6 messages x 300 chars [VERIFIED: ai.ts:44-51]
- Hint model: claude-haiku-4-5-20251001 (correct) [VERIFIED: ai.ts:70]
- Score model: claude-sonnet-4-6 (correct for Anthropic) [VERIFIED: ai.ts:71]
- Gemini score model: gemini-2.5-flash (BUG -- should be pro) [VERIFIED: ai.ts:82]

**AICOST-02 assessment:** The existing `LIMITS_AI` in ai.ts already limits semantic graph context effectively. No pixel data is sent (SemanticGraph abstraction handles this). This requirement is largely already met.

**AICOST-03 assessment:** Hint endpoint correctly uses Haiku for Anthropic. Verify the route actually uses `MODEL_MAP.haiku` and not a hardcoded string.

**AICOST-04 fix needed:** Change `GEMINI_MODEL_MAP.pro` from `"gemini-2.5-flash"` to `"gemini-2.5-pro"`.

**AICOST-01 (voice transcript):** Voice feature is Phase 5, but the token budget infrastructure should be established now. Add `truncateToTokenBudget()` utility and document the 200-token cap as a constant in `LIMITS_AI`.

## Monitoring & Observability

**What to measure (no new dependencies needed):**
1. **Canvas save success rate** -- count successful vs failed PATCH calls in SessionPage
2. **API response times** -- add timing headers to hint/score routes (`X-Response-Time`)
3. **DB connection health** -- Supabase dashboard (external)
4. **Bundle size** -- CI step with @next/bundle-analyzer
5. **AI token usage** -- log input/output token counts from API responses (Anthropic SDK returns usage stats)

**Implementation:** Use `console.warn` for metrics (per CLAUDE.md convention -- no console.log). For production, consider adding a lightweight analytics endpoint later.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | tldraw bundle is ~500KB+ gzipped | Page Load Optimization | If smaller, dynamic import is less critical but still beneficial |
| A2 | Supabase free tier has 60 direct connections | Connection Pooling | If lower, need more aggressive connection_limit |
| A3 | 4G averages 1.5 Mbps | Page Load | Transfer budget calculation off; adjust target |
| A4 | 4 chars/token heuristic for English | Token Budget | Voice truncation may be slightly off; acceptable for budgeting |
| A5 | @next/bundle-analyzer is the standard tool | Bundle Analysis | If deprecated, use webpack-bundle-analyzer directly |

## Open Questions

1. **What is the current DATABASE_URL format?**
   - What we know: Prisma uses pg adapter with Supabase
   - What's unclear: Whether pooled connection string (port 6543) or direct (5432) is used
   - Recommendation: Check .env.local; switch to pooled if not already

2. **Is socket.io actively used?**
   - What we know: socket.io and socket.io-client are in dependencies; socket-client.ts exists
   - What's unclear: Whether WebSocket connections are active in production (adds connection overhead)
   - Recommendation: If not used for real-time features yet, ensure it's not establishing idle connections

3. **What is the actual tldraw bundle size?**
   - Recommendation: Run bundle analyzer before planning specific optimizations

## Project Constraints (from CLAUDE.md)

- No `console.log` in committed code -- use `console.warn` / `console.error`
- No `any` without comment
- All shared types in `src/types/index.ts`
- Never send raw tldraw records to AI
- Never read hintsUsed/scoresUsed from request body
- DB is source of truth for limits
- IndexedDB failures are non-fatal
- Streaming: await model call BEFORE constructing ReadableStream

## Sources

### Primary (HIGH confidence)
- Codebase files: graph-parser.ts, ai.ts, limits.ts, daily-limits.ts, InterviewCanvas.tsx, session/[id]/page.tsx
- CLAUDE.md project conventions
- CONCERNS.md identified bottlenecks

### Secondary (MEDIUM confidence)
- PITFALLS.md research findings

### Tertiary (LOW confidence)
- Bundle size estimates, Supabase connection limits, 4G speed assumptions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package.json and source
- Architecture fixes: HIGH - root causes verified in source code
- Performance targets: MEDIUM - 4G budget is estimated
- AI cost: HIGH - model routing verified, bug confirmed

**Research date:** 2026-04-15
**Valid until:** 2026-05-15
