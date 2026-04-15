# Technology Stack — New Feature Additions

**Project:** SysDraw (ArchArena)
**Researched:** 2026-04-15
**Scope:** Dashboard, voice transcription, analytics, performance optimization

## Existing Stack (Keep As-Is)

Next.js 16 + React 19, tldraw 4.5, Zustand 5, NextAuth v5, Prisma 7 + PostgreSQL, Anthropic SDK, Tailwind CSS 4, LemonSqueezy. No changes needed to core stack.

## New Additions

### Dashboard UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 3.x | Score charts, progress graphs | shadcn/ui charts are built on Recharts. Already Tailwind-compatible. Lightweight, composable, SSR-friendly. |
| shadcn/ui chart components | latest | Chart wrappers (ChartTooltip, etc.) | Copy-paste components, no heavy dependency. Works with existing Tailwind dark theme. Only pull in chart primitives, not full shadcn/ui. |

**Confidence:** HIGH — shadcn/ui officially uses Recharts, well-documented, massive adoption.

**Why NOT Tremor:** Tremor is built ON Recharts but adds abstraction that limits customization. Since we need dark theme integration and custom styling, going directly to Recharts via shadcn/ui chart components gives more control with less dependency weight.

**Why NOT Nivo:** Heavier bundle (d3 under the hood), overkill for score breakdowns and progress lines. Recharts covers bar/line/radar charts which is all we need.

### Voice Recording & Transcription

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Web Speech API (browser native) | N/A | Real-time speech-to-text for voice memos | Zero dependency, free, no API key needed. Chrome/Edge/Safari support covers 90%+ of users. |
| MediaRecorder API (browser native) | N/A | Record audio blobs for playback/storage | Native browser API, no library needed. Store as WebM/Opus blobs. |

**Confidence:** MEDIUM — Web Speech API works well in Chrome/Edge but Firefox support is limited. For a practice tool targeting desktop users, this is acceptable.

**Approach:** Voice memos (not continuous transcription). User clicks record, speaks, stops. Transcript appended to SemanticGraph context before AI calls. Audio blob optionally saved to IndexedDB for playback.

**Why NOT OpenAI Whisper API:** Adds cost per transcription, requires server round-trip, needs API key management. Voice memos are short (under 60s) — browser-native recognition is accurate enough for this use case and keeps costs at zero.

**Why NOT Deepgram/AssemblyAI:** Same cost concerns. Only justified if we need multi-language support or high-accuracy transcription, which we don't for v1 voice memos.

**Fallback plan:** If Web Speech API is unavailable (Firefox), show a text input fallback where users type their explanation. Feature degrades gracefully, not catastrophically.

### Analytics / Progress Tracking

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL (existing) | — | Store score history, attempt counts | Already have the DB. Add columns/tables to InterviewSession or a new ScoreHistory model. No new service needed. |
| Recharts (same as dashboard) | 3.x | Render progress charts | Reuse the same charting lib for score-over-time, radar breakdown, attempt history. |

**Confidence:** HIGH — This is a data modeling + UI problem, not a technology problem. No new dependencies needed.

**What to track:** Score per attempt (timestamped), breakdown scores (scalability/reliability/tradeoffs/completeness), hints used per session, time spent. All derivable from existing InterviewSession model with minor schema additions.

### Performance Optimization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next/dynamic | built-in | Lazy-load tldraw canvas | tldraw is heavy (~500KB+). Dynamic import with `ssr: false` prevents server-side loading and reduces initial bundle. |
| React.lazy + Suspense | built-in | Code-split heavy components | Dashboard charts, score panels don't need to load on initial page. |
| @vercel/analytics | latest | Core Web Vitals monitoring | If deploying to Vercel. Lightweight, auto-reports LCP/FID/CLS. Optional. |

**Confidence:** HIGH — These are built-in Next.js/React patterns, no new dependencies.

**AI Token Optimization (no new deps):**
- Truncate SemanticGraph before sending (cap nodes, summarize edges)
- Cache scoring prompts for identical graphs (hash-based)
- Reduce max_tokens on hint responses (already 150, verify enforcement)

### Canvas Tutorial / Onboarding

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| No new library | — | Custom tooltip/overlay component | A 3-step tooltip walkthrough is simpler to build with Tailwind + Zustand (track `hasSeenTutorial`) than importing a tour library. Keep it lightweight. |

**Confidence:** HIGH — Tour libraries (react-joyride, shepherd.js) add 30-50KB for something achievable with a few positioned divs and a Zustand boolean.

### Enhanced Component Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| No new library | — | More tldraw custom shapes | Extend existing pattern in `src/components/canvas/shapes/`. Add shapes for: AWS Lambda, Kubernetes, Nginx, RabbitMQ, Elasticsearch, MongoDB, DynamoDB, CloudFront, API Gateway. Pure React + tldraw shape API. |

**Confidence:** HIGH — Pattern already established in codebase. Just more shape definitions.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Charts | Recharts 3 via shadcn/ui | Tremor | Extra abstraction layer, less customizable for dark theme |
| Charts | Recharts 3 via shadcn/ui | Nivo | Heavier (d3), overkill for simple score charts |
| Voice | Web Speech API | OpenAI Whisper | Adds per-request cost, unnecessary for short memos |
| Voice | Web Speech API | Deepgram | Paid service, overkill for v1 |
| Tour | Custom Tailwind overlays | react-joyride | 30KB+ for 3 tooltip steps |
| Analytics DB | PostgreSQL (existing) | Mixpanel/Amplitude | Overkill, adds external dependency, data already in Postgres |

## Installation

```bash
# Charts (only new production dependency)
npx shadcn@latest add chart
# This pulls in recharts as a dependency automatically

# Optional: Vercel analytics (if deploying to Vercel)
npm install @vercel/analytics
```

That's it. Every other new feature uses browser-native APIs or extends existing code patterns.

## Integration Points with Existing Stack

| New Feature | Touches |
|-------------|---------|
| Dashboard | New `src/app/dashboard/page.tsx`, reads from Prisma InterviewSession |
| Voice memos | `src/components/canvas/VoiceMemo.tsx`, transcript fed into SemanticGraph context in `graph-parser.ts` |
| Analytics | New Prisma model or extended InterviewSession fields, new `/api/analytics` route |
| Performance | `next/dynamic` wrapper around existing `InterviewCanvas`, React.lazy for chart components |
| Tutorial | Zustand `hasSeenTutorial` flag, overlay component on session page |
| New shapes | New files in `src/components/canvas/shapes/`, register in shape utils |

## Sources

- [shadcn/ui Charts Documentation](https://ui.shadcn.com/docs/components/radix/chart)
- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Recharts v3 + shadcn/ui discussion](https://github.com/shadcn-ui/ui/issues/7669)
- [React chart libraries comparison 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/)

---

*Stack research: 2026-04-15*
