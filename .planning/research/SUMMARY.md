# Project Research Summary

**Project:** SysDraw (ArchArena) -- Production Push
**Domain:** System design interview practice SaaS
**Researched:** 2026-04-15
**Confidence:** HIGH

## Executive Summary

SysDraw is a functioning system design interview practice tool that needs production-readiness features: a post-login dashboard, progress analytics, voice explanation capture, expanded component library, and stability hardening. Nearly all new features attach to well-defined boundaries in the existing architecture with minimal new dependencies. The only new production dependency is Recharts (via shadcn/ui chart components). Everything else uses browser-native APIs or extends existing code patterns.

The recommended approach is a strict build order: stability first, then dashboard, then analytics, then voice. This order follows the dependency chain (dashboard needs a stable app, analytics needs dashboard, voice is experimental and independent) and front-loads the highest-risk work (canvas save storms, connection pooling). All four research files converge on this ordering.

The key risks are: canvas save storms exhausting Supabase connection pools (must fix before anything else), voice transcripts inflating AI token costs (budget tokens before building), and analytics queries degrading the primary database (pre-compute stats on write, never aggregate on page load). All three are preventable with upfront design decisions.

## Key Findings

### Recommended Stack

No changes to the core stack. One new dependency: Recharts via shadcn/ui chart component. Voice uses browser-native MediaRecorder + Web Speech API (zero cost, zero infrastructure). Analytics queries existing PostgreSQL data. Performance work uses built-in Next.js patterns (dynamic imports, React.lazy).

**New technologies:**
- **Recharts 3 (via shadcn/ui):** Score trend charts, radar breakdowns -- lightweight, Tailwind-compatible, SSR-friendly
- **Web Speech API (browser native):** Voice memo transcription -- free, client-side, Chrome/Edge/Safari coverage
- **MediaRecorder API (browser native):** Audio blob capture -- cross-browser, no library needed

### Expected Features

**Must have (table stakes):**
- Post-login dashboard with session list and score summaries
- Session history with resume capability
- Responsive layout fixes
- Text labels as semantic context in graph-parser
- Complete vendor shape coverage (6-8 new shapes: Elasticsearch, Lambda, K8s, DNS, Firewall, Monitoring, ServiceMesh)
- First-time canvas tutorial

**Should have (differentiators):**
- Voice transcription fed to AI (AI hears verbal reasoning, not just shapes)
- Score trend analytics with per-category breakdowns
- Question difficulty recommendations based on past scores

**Defer (v2+):**
- Cumulative voice memo timeline with canvas state association
- Shape grouping / subsystem boundaries
- AI voice responses (TTS)
- Mobile canvas editing

### Architecture Approach

Four new modules attach at clean boundaries. Dashboard and Analytics are read-only against existing InterviewSession data (no new DB tables). Voice adds one nullable field (voiceTranscript) to InterviewSession and feeds transcript as additive context to ai.ts prompt builders -- the SemanticGraph type does NOT change. Performance work touches existing files only.

**Major components:**
1. **Dashboard Module** -- server-rendered landing page, session list API, analytics API (all read-only against existing data)
2. **Voice Explanation Module** -- client-side recorder, Zustand transcript state, transcript appended to AI prompts as separate parameter
3. **Analytics Module** -- score trends and category breakdowns via Recharts, data from Prisma aggregation queries
4. **Performance/Stability** -- ErrorBoundary for canvas, lazy-load tldraw, debounce tuning, connection pooling audit

### Critical Pitfalls

1. **Canvas save storms** -- Debounce to 3-5s, save to IndexedDB first, batch DB writes, add circuit breaker on consecutive failures
2. **Voice token cost explosion** -- Cap voice context at 200 tokens, summarize memos into key decisions before appending to prompt, never send raw transcriptions
3. **Analytics queries degrading primary DB** -- Pre-compute stats on score write (UserStats table or counter pattern), never run aggregation on page load
4. **Web Speech API browser incompatibility** -- Feature-detect on first use, show clear not-supported message, provide text input fallback for Firefox
5. **Enhanced components breaking saved sessions** -- Never rename/remove shape type IDs, only add new ones, version the shape schema

## Implications for Roadmap

### Phase 1: Stability and Performance
**Rationale:** Crashes and save storms block all testing of new features. Must fix first.
**Delivers:** Reliable canvas saves, error recovery, optimized initial load
**Addresses:** Responsive layout fixes, debounce tuning, ErrorBoundary, lazy-load tldraw, daily limit reset fix (UTC midnight)
**Avoids:** Canvas save storms (Pitfall 1), tldraw layout breaks (Pitfall 10), daily limit race condition (Pitfall 7)

### Phase 2: Dashboard and Session Management
**Rationale:** Users need a landing page. Dashboard is the foundation for analytics and the primary navigation hub.
**Delivers:** Post-login dashboard, session list with score summaries, middleware redirect to /dashboard
**Addresses:** Dashboard, session history list, score summary display
**Avoids:** Analytics killing DB (Pitfall 3) -- design pre-computed stats pattern now even if analytics UI comes later

### Phase 3: Enhanced Interview Experience
**Rationale:** Improve the core interview loop before adding analytics on top of it. More shapes and tutorial improve session quality, which produces better data for analytics.
**Delivers:** 6-8 new vendor shapes, canvas tutorial, text labels as semantic context, AI token optimization
**Addresses:** Complete vendor shape coverage, first-time tutorial, text label context
**Avoids:** Breaking saved sessions (Pitfall 9), false text associations (Pitfall 8), tutorial blocking canvas (Pitfall 5)

### Phase 4: Analytics and Progress Tracking
**Rationale:** Requires multiple scored sessions to be meaningful. Dashboard must exist first. Recharts dependency shared with dashboard charts.
**Delivers:** Score trend line charts, per-category radar breakdowns, question difficulty recommendations
**Addresses:** Progress analytics, per-category trends, backfill migration for existing sessions
**Avoids:** Empty dashboards (Pitfall 11), chart re-render jank (Pitfall 6)

### Phase 5: Voice Explanations
**Rationale:** Most experimental feature. Benefits from stable canvas (Phase 1) and existing AI prompt patterns. Build last to validate product-market fit of core features first.
**Delivers:** Voice memo recording, browser-side transcription, transcript fed to AI context
**Addresses:** Voice recording (MediaRecorder), voice transcription, AI prompt integration
**Avoids:** Token cost explosion (Pitfall 2), browser incompatibility (Pitfall 4)

### Phase Ordering Rationale

- Stability before features: canvas save storms will corrupt testing of everything else
- Dashboard before analytics: analytics extends dashboard, shares API patterns and chart library
- Enhanced shapes before analytics: better sessions produce better score data to analyze
- Voice last: highest complexity, highest risk, most experimental, least dependency from other features

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Voice):** Browser Speech API vs server-side Whisper tradeoff needs prototyping. Token budget design for voice context is non-trivial.
- **Phase 3 (Enhanced Shapes):** Need to audit existing graph-parser category mapping to ensure new shape types integrate cleanly.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Stability):** Well-documented Next.js/React patterns (ErrorBoundary, dynamic imports, debounce)
- **Phase 2 (Dashboard):** Standard server-rendered page with Prisma queries, no novel patterns
- **Phase 4 (Analytics):** Recharts is well-documented, data already exists in DB

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Minimal new dependencies, all well-documented and widely adopted |
| Features | HIGH | Clear table stakes vs differentiators, dependency chain well understood |
| Architecture | HIGH | All new modules attach at clean boundaries, no fundamental changes needed |
| Pitfalls | HIGH | Canvas save storms and token costs are concrete, measurable risks with known mitigations |

**Overall confidence:** HIGH

### Gaps to Address

- **Voice transcription approach:** STACK.md recommends Web Speech API, FEATURES.md recommends MediaRecorder + server transcription, PITFALLS.md warns about browser incompatibility. Resolution: use MediaRecorder for audio capture (reliable cross-browser) + Web Speech API for transcription where available + text input fallback. Finalize during Phase 5 planning.
- **Analytics data model:** Whether to pre-compute into a UserStats table or use Prisma aggregation queries depends on actual query performance. Benchmark during Phase 2 when dashboard queries are built.
- **Token budget for voice context:** Exact token allocation (200 tokens suggested) needs testing with real voice memos to ensure useful context is preserved after summarization.

## Sources

### Primary (HIGH confidence)
- shadcn/ui Charts Documentation -- Recharts integration pattern
- MDN Web Speech API / MediaRecorder API -- browser compatibility data
- tldraw custom shapes documentation -- shape extension pattern
- Existing codebase analysis (CLAUDE.md, graph-parser.ts, ai.ts)

### Secondary (MEDIUM confidence)
- React chart library comparisons (LogRocket 2025) -- Recharts vs alternatives
- SaaS dashboard design best practices -- layout patterns

---
*Research completed: 2026-04-15*
*Ready for roadmap: yes*
