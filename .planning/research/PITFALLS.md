# Domain Pitfalls

**Domain:** System design interview practice SaaS (SysDraw production push)
**Researched:** 2026-04-15

## Critical Pitfalls

### Pitfall 1: Canvas save storms killing the database during drawing
**What goes wrong:** tldraw fires hundreds of store events per second. Without aggressive debouncing, every pixel drag triggers a PATCH to `/api/session/[id]/canvas`, exhausting Supabase connection pools. Already identified in CONCERNS.md but not yet fixed.
**Why it happens:** Developers wire up "save on change" without realizing tldraw's event frequency. The `hasGraphChanged()` diff helps but still fires too often during active drawing.
**Consequences:** DB connection pool exhaustion at 10+ concurrent users. Supabase returns 503s. All users lose saves simultaneously.
**Prevention:** Debounce canvas saves to 3-5 seconds. Save to IndexedDB immediately (local recovery), batch DB writes. Add a circuit breaker that stops saves if 3 consecutive requests fail.
**Detection:** Monitor Supabase connection count and query latency. Alert if >50 queries/sec from canvas endpoints.
**Phase:** Stability/performance phase (before any new features).

### Pitfall 2: Voice feature bloating AI token costs beyond budget
**What goes wrong:** Voice memos get transcribed to text and appended to AI context. A 2-minute voice memo produces ~300 words (~400 tokens). Three memos per session means 1200+ extra tokens per hint/score call. On free tier with Haiku, this triples cost per request.
**Why it happens:** Teams add voice transcripts directly to the prompt without budgeting token impact. The existing `truncateGraphForAI()` caps graph tokens but nobody adds equivalent truncation for voice context.
**Consequences:** AI costs blow past budget. Free tier becomes unsustainable. Or worse, truncation silently drops voice context, making the feature useless.
**Prevention:** Budget voice context to a fixed token window (e.g., 200 tokens max for voice summary). Summarize voice memos into key architectural decisions before appending to prompt. Never send raw transcriptions to AI.
**Detection:** Track tokens-per-request in a simple counter. Alert if average exceeds 2x baseline.
**Phase:** Voice feature phase. Must design token budget before building transcription.

### Pitfall 3: Dashboard analytics queries degrading the primary database
**What goes wrong:** Analytics queries (average scores over time, attempt counts, percentile rankings) run expensive aggregations against the same Postgres instance serving real-time canvas saves and AI requests.
**Why it happens:** It's easy to add `SELECT AVG(score) FROM InterviewSession GROUP BY date` and not realize it table-scans thousands of rows during peak usage.
**Consequences:** Canvas saves and AI requests slow down. Users experience lag during drawing because the DB is busy computing someone's analytics dashboard.
**Prevention:** Pre-compute analytics on write (increment counters in a `UserStats` table when scores are saved). Never run aggregation queries on page load. If needed, use a read replica or compute analytics async (cron job).
**Detection:** Slow query log in Supabase. Any query >100ms on the analytics endpoint.
**Phase:** Analytics phase. Design the data model (materialized stats) before building the UI.

### Pitfall 4: Web Speech API browser incompatibility breaking voice feature silently
**What goes wrong:** The Web Speech API (SpeechRecognition) has wildly inconsistent support. Chrome works, Firefox has partial support, Safari has bugs with continuous recognition. Users on unsupported browsers see nothing -- no error, just a broken button.
**Why it happens:** Developers test only in Chrome. MDN shows "supported" but real-world behavior varies (e.g., Safari stops recognition after 60 seconds, Firefox requires user gesture each time).
**Consequences:** Support tickets from non-Chrome users. Feature appears broken with no feedback.
**Prevention:** Use MediaRecorder API (record audio blob) + server-side transcription (Whisper API or similar) instead of browser Speech API. If client-side is required, feature-detect with a test utterance on first use and show a clear "not supported" message.
**Detection:** Log browser UA on voice feature usage. Track success/failure rates per browser.
**Phase:** Voice feature phase. Choose transcription approach before building UI.

## Moderate Pitfalls

### Pitfall 5: First-time tutorial blocking returning users or breaking canvas state
**What goes wrong:** Tutorial overlays interfere with tldraw's event system. Tooltips that capture clicks prevent shape placement. Or the "completed" flag isn't persisted properly, showing the tutorial every visit.
**Prevention:** Store tutorial completion in the User DB record (not localStorage/IndexedDB). Use a non-blocking tooltip approach that doesn't capture tldraw events. Test that all canvas interactions work WITH the tutorial visible.

### Pitfall 6: Score history charts re-rendering on every state change
**What goes wrong:** A chart component (Chart.js, Recharts) inside a React component re-renders on every Zustand state update, causing jank. With 50+ data points, chart re-renders take 100ms+.
**Prevention:** Isolate chart components with `React.memo` and selector-based Zustand subscriptions. Only subscribe to the specific slice of state the chart needs. Use `useMemo` for data transformation.

### Pitfall 7: Daily limit reset race condition during midnight UTC
**What goes wrong:** Already identified in CONCERNS.md -- the 24-hour rolling window causes inconsistent resets. When adding analytics that display "hints remaining today," the UI shows different numbers than the server enforces.
**Prevention:** Fix the daily reset to UTC midnight before building any dashboard that displays limits. Single source of truth: server response, not client calculation.

### Pitfall 8: Text label parsing creating false semantic connections
**What goes wrong:** When text labels become first-class context, a label saying "handles 10K RPS" near two components gets associated with both. The AI then incorrectly assumes both components handle 10K RPS.
**Prevention:** Tighten annotation association (the current 240px magic number is too generous). Associate labels only with their parent shape or the single nearest shape. Add a confidence score to associations.

### Pitfall 9: Enhanced component library breaking existing saved sessions
**What goes wrong:** Adding new vendor shapes or changing shape categories means old sessions reference shape types that no longer match the new definitions. Deserializing old canvas state fails or renders incorrectly.
**Prevention:** Never rename or remove shape type identifiers. Only add new ones. Version the shape schema. Add a migration function that maps old shape types to new ones on session load.

## Minor Pitfalls

### Pitfall 10: Responsive UI breaking tldraw's internal layout calculations
**What goes wrong:** CSS changes to make the page responsive (flex, grid, viewport units) cause tldraw's container to have zero height or incorrect dimensions. The canvas appears blank or shapes are offset.
**Prevention:** tldraw requires explicit pixel dimensions on its container. Use `ResizeObserver` to update container dimensions, not CSS-only solutions. Test at 3 breakpoints minimum.

### Pitfall 11: Analytics data not backfilled for existing sessions
**What goes wrong:** New analytics features only track data from new sessions. Existing users see empty dashboards and think the feature is broken.
**Prevention:** Write a one-time migration script that computes analytics from existing `InterviewSession` records. Run before deploying the analytics UI.

### Pitfall 12: AI token optimization breaking prompt quality
**What goes wrong:** Aggressive token reduction (shorter prompts, fewer examples, smaller context windows) degrades AI response quality. Hints become generic. Scores become inconsistent.
**Prevention:** A/B test token-optimized prompts against current prompts before deploying. Measure score consistency (same diagram should get similar scores). Set a quality floor: if optimization drops quality below threshold, keep the longer prompt.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Stability/Performance | Canvas save storms (Pitfall 1) | Debounce + IndexedDB-first saves before any feature work |
| Dashboard | Analytics killing DB (Pitfall 3) | Pre-computed stats table, no aggregation queries on load |
| Voice Feature | Token cost explosion (Pitfall 2) + browser compat (Pitfall 4) | Budget tokens first, choose server-side transcription |
| Enhanced Components | Breaking saved sessions (Pitfall 9) | Never change existing shape type IDs, only add |
| Text Labels | False associations (Pitfall 8) | Tighten annotation distance, single-nearest-shape rule |
| Tutorial | Blocking canvas events (Pitfall 5) | Non-capturing tooltip overlay, DB-persisted completion |
| Analytics UI | Empty dashboards (Pitfall 11) | Backfill migration script before deploying UI |
| Token Optimization | Quality degradation (Pitfall 12) | A/B test before deploying, set quality floor |
| Responsive UI | tldraw layout breaks (Pitfall 10) | Explicit pixel dimensions, ResizeObserver |
| Daily Limits Fix | Race condition (Pitfall 7) | UTC midnight reset before any limit-displaying UI |

## Sources

- SysDraw CONCERNS.md analysis (existing codebase audit)
- tldraw v2 container sizing requirements (known behavior from tldraw docs)
- Web Speech API compatibility data (MDN, caniuse)
- Domain experience with real-time canvas applications and AI token management

---

*Pitfalls audit: 2026-04-15*
