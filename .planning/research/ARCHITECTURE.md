# Architecture: New Feature Integration

**Project:** SysDraw Production Push
**Researched:** 2026-04-15

## Recommended Architecture

Four new feature domains integrate into the existing layered architecture. None require fundamental changes -- they attach at well-defined boundaries.

```
                        +------------------+
                        |   Dashboard Page |  (NEW)
                        +--------+---------+
                                 |
              +------------------+------------------+
              |                  |                   |
     +--------v------+  +-------v-------+  +--------v--------+
     | Analytics API  |  | Session List  |  | Progress Charts |
     | /api/analytics |  | /api/sessions |  | (client-only)   |
     +--------+------+  +-------+-------+  +-----------------+
              |                  |
              +--------+---------+
                       |
              +--------v--------+
              |   PostgreSQL    |
              | (existing DB)   |
              +-----------------+

     Canvas Page (existing)
        |
        +---> Voice Recorder (NEW, client component)
        |        |
        |        +---> Web Audio API (browser)
        |        +---> /api/session/[id]/voice (NEW)
        |                  |
        |                  +---> Blob storage or DB (base64)
        |                  +---> Whisper API or browser SpeechRecognition
        |
        +---> SemanticGraph (existing, enhanced with voice transcript)
        |
        +---> AI endpoints (existing, receive transcript as context)
```

## Component Boundaries

### 1. Dashboard Module

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/app/dashboard/page.tsx` | Landing page after login, shows session list + stats | Session List API, Analytics API |
| `src/app/api/sessions/route.ts` | List user's sessions with scores/status | Prisma (InterviewSession) |
| `src/app/api/analytics/route.ts` | Aggregate score data per user | Prisma (InterviewSession) |
| `src/components/dashboard/SessionCard.tsx` | Single session summary card | Props only |
| `src/components/dashboard/ProgressChart.tsx` | Score trend visualization | Props only (data from parent) |

**Boundary rule:** Dashboard is read-only against existing InterviewSession data. No new DB models needed. Analytics are computed server-side via Prisma aggregation queries, not stored separately.

### 2. Voice Explanation Module

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/components/canvas/VoiceRecorder.tsx` | Record/stop/playback UI, "use client" | Web Audio API, Zustand |
| `src/lib/voice.ts` | Audio processing utilities (compress, encode) | Browser APIs |
| `src/app/api/session/[id]/voice/route.ts` | Store transcript, optionally store audio | Prisma, transcription service |
| Zustand store extension | `voiceTranscript: string` field | AI prompt builders |

**Boundary rule:** Voice is additive context. The transcript string gets appended to SemanticGraph context in `ai.ts` prompt builders. Audio blobs stay client-side or in a simple DB text field (transcript only). Never send raw audio to AI endpoints.

**Transcription approach:** Use browser-native `SpeechRecognition` API (Web Speech API) for v1. It is free, runs client-side, requires zero infrastructure. Fall back to a "no transcription available" message on unsupported browsers. Whisper API is overkill for v1 with 10 users.

### 3. Analytics Module

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/app/dashboard/analytics/page.tsx` | Full analytics view | Analytics API |
| `src/app/api/analytics/route.ts` | Score history, attempt counts, per-prompt breakdown | Prisma |
| `src/components/analytics/ScoreTrend.tsx` | Line chart of scores over time | Props (chart library) |
| `src/components/analytics/CategoryBreakdown.tsx` | Radar/bar chart of score categories | Props |

**Boundary rule:** Analytics reads from existing `InterviewSession` rows. The `scoreResult` JSON field already contains category breakdowns. No new tables -- just queries.

**Chart library:** Use lightweight `recharts` (built on D3, React-native, ~45KB gzipped). No heavier options needed for simple line/bar/radar charts.

### 4. Performance & Stability Module

This is not a "feature" with components -- it is a set of targeted fixes across existing code.

| Concern | Location | Action |
|---------|----------|--------|
| Slow initial load | `src/app/session/[id]/page.tsx` | Lazy-load tldraw with `dynamic(() => import(...), { ssr: false })`. It is likely already done but verify chunk size. |
| Canvas crash recovery | `src/components/canvas/InterviewCanvas.tsx` | Wrap tldraw in React ErrorBoundary. On crash, offer "reload canvas" instead of white screen. |
| API route cold starts | All `/api/` routes | Prisma connection pooling via `@prisma/extension-accelerate` (already installed). Verify it is actually used. |
| Memory leaks | Zustand store, tldraw listeners | Ensure all `useEffect` cleanup functions remove listeners. Audit store subscriptions. |
| Debounce tuning | Canvas autosave (3s), graph diff | 3s is fine. Verify `hasGraphChanged()` is not doing deep equality on large objects -- should be hash-based. |

**Boundary rule:** Performance work touches existing files only. No new components.

## Data Flow for New Features

### Dashboard Data Flow

```
1. User logs in -> middleware redirects to /dashboard (NOT / or /session)
2. Dashboard page calls GET /api/sessions (auth-checked)
3. Route queries: SELECT id, promptId, status, scoreResult, updatedAt
   FROM InterviewSession WHERE userId = ? ORDER BY updatedAt DESC
4. Dashboard page calls GET /api/analytics (auth-checked)
5. Route queries: aggregate scores, count attempts, group by promptId
6. Client renders cards + charts from response data
7. User clicks session card -> navigates to /session/[id] (existing flow)
```

### Voice Transcript Flow

```
1. User clicks "Record" in VoiceRecorder (canvas page)
2. Browser SpeechRecognition captures interim + final transcripts
3. On stop, final transcript stored in Zustand: voiceTranscript
4. Transcript saved with canvas via existing autosave (add to PATCH body)
5. When user requests hint/score, ai.ts reads voiceTranscript from request
6. Prompt builder appends: "User's verbal explanation: {transcript}"
7. AI uses transcript as additional context alongside SemanticGraph
```

### Analytics Data Flow

```
1. User navigates to /dashboard/analytics
2. Page calls GET /api/analytics?range=30d
3. Route aggregates from InterviewSession:
   - Score history: [{date, score, promptId}]
   - Category averages: {scalability: avg, reliability: avg, ...}
   - Attempt counts per prompt
4. Client renders charts from aggregated data
```

## Database Changes

Minimal. Only two additions needed:

```prisma
model InterviewSession {
  // existing fields...
  voiceTranscript String?  // NEW: accumulated voice memo text
}
```

No new tables. Analytics computed from existing `scoreResult` JSON and session metadata.

## Patterns to Follow

### Pattern: Server-Computed Analytics
Compute aggregations in API routes, not on the client. Prisma's `groupBy` and `aggregate` handle this efficiently. Never fetch all sessions and compute client-side.

### Pattern: Additive Context for AI
Voice transcripts, text labels, and future context sources all follow the same integration pattern: they become additional string sections in the prompt built by `ai.ts`. The SemanticGraph type does NOT change -- extra context is passed as separate parameters to prompt builders.

```typescript
// In ai.ts prompt builders:
function buildHintPrompt(graph: SemanticGraph, history: ChatMessage[], voiceTranscript?: string) {
  let context = formatGraph(graph);
  if (voiceTranscript) {
    context += `\n\nUser's verbal explanation:\n${voiceTranscript}`;
  }
  // ... build prompt
}
```

### Pattern: Lazy Loading Heavy Components
tldraw, chart libraries, and voice recorder should all use Next.js `dynamic()` with `ssr: false`. These are large client-only bundles.

## Anti-Patterns to Avoid

### Anti-Pattern: Separate Analytics Database
Do NOT create a separate analytics table or event-sourcing system. With 10 target users, query InterviewSession directly. Premature optimization.

### Anti-Pattern: Audio File Storage
Do NOT store audio files in PostgreSQL or build a file upload pipeline for v1. Store only the transcript text. Audio playback is ephemeral (session-only, from browser memory).

### Anti-Pattern: Real-time Dashboard Updates
Do NOT use WebSockets for dashboard updates. The existing socket.io dependency is there but dashboard data is not real-time. Simple fetch-on-mount is sufficient.

### Anti-Pattern: Changing SemanticGraph Shape
Do NOT add voice/analytics fields to `SemanticGraph`. It represents canvas structure only. Additional context travels as separate parameters.

## Suggested Build Order

Based on dependencies:

1. **Performance & Stability** (no dependencies, unblocks everything)
   - ErrorBoundary, lazy loading, connection pooling audit
   - Must be first: crashes block all testing of new features

2. **Dashboard + Session List** (depends on: stable app)
   - New pages + 2 API routes reading existing data
   - Changes the post-login flow (middleware redirect)
   - Unblocks analytics (shares API patterns)

3. **Analytics** (depends on: dashboard exists)
   - Extends dashboard with charts
   - Requires `recharts` dependency
   - Reads same data as session list, just aggregated differently

4. **Voice Explanation** (independent, but benefits from stable canvas)
   - Client-side recording + browser SpeechRecognition
   - One DB migration (voiceTranscript field)
   - Touches ai.ts prompt builders (careful, shared code)
   - Build last because it is the most experimental feature

## Scalability Considerations

| Concern | At 10 users | At 1K users | At 10K users |
|---------|-------------|-------------|--------------|
| Analytics queries | Direct SQL, fast | Add indexes on (userId, updatedAt) | Materialized views or pre-computed daily summaries |
| Voice transcripts | Browser API, free | Browser API, free | Consider server-side Whisper for accuracy |
| Dashboard load | Single query, trivial | Paginate session list | Cache with ISR or Redis |
| AI token costs | Manageable | Rate limit free tier aggressively | Queue system for scoring requests |

## Sources

- Existing codebase analysis (ARCHITECTURE.md, STACK.md, CLAUDE.md)
- Web Speech API: browser-native, no cost, supported in Chrome/Edge (sufficient for target users)
- recharts: lightweight React charting, widely adopted, minimal bundle impact
- Prisma aggregation: groupBy/aggregate supported since Prisma 2.x, well-documented
