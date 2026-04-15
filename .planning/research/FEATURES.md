# Feature Landscape

**Domain:** System design interview practice SaaS — production push features
**Researched:** 2026-04-15
**Focus:** Dashboard, voice, analytics, enhanced components

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Post-login dashboard** | Users need a landing page showing their sessions, not dumped into question picker | Med | F-pattern layout: recent sessions top-left, question picker center, stats sidebar |
| **Session history list** | Users expect to see past attempts and resume them | Low | Already have `InterviewSession` with `@@unique([userId, promptId])` — query all for user |
| **Score summary on dashboard** | Users want to see their latest scores at a glance without opening each session | Low | Aggregate `scoreResult` from InterviewSession rows |
| **Voice memo recording** | Users need to explain design decisions verbally — AI currently only sees shapes | High | Use MediaRecorder API (not Web Speech API) to capture audio blobs, then transcribe |
| **Text labels as semantic context** | Already in PROJECT.md as active — graph-parser must treat all canvas text as context | Med | Modify `parseCanvasToGraph()` to include tldraw text shapes as annotations |
| **Complete vendor shape coverage** | Missing: search (Elasticsearch), streaming (Kafka already exists as Queue), DNS, firewall, container/K8s, serverless/Lambda, monitoring | Med | ~6-8 new ShapeUtil classes following existing pattern |
| **Canvas tutorial (one-time)** | First-time users stare at blank canvas with no guidance | Med | localStorage flag (or DB) + overlay steps showing toolbar, shapes, hints, scoring |
| **Responsive layout fixes** | Broken responsiveness mentioned as production blocker | Med | Session page needs mobile-aware layout; canvas is inherently desktop but panels must stack |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Voice transcription fed to AI** | AI interviewer hears your verbal reasoning, not just shapes — dramatically richer feedback | High | Transcribe via Whisper API or browser SpeechRecognition, append to SemanticGraph context |
| **Progress analytics with score trends** | Line chart showing score improvement across attempts per question | Med | Query all scored sessions, plot over time with Recharts or lightweight chart lib |
| **Per-category score breakdown trends** | Track scalability/reliability/tradeoffs/completeness individually over time | Med | ScoreResult already has breakdown — aggregate and chart per dimension |
| **Question difficulty recommendations** | Based on past scores, suggest which questions to attempt next | Low | Simple algorithm: suggest questions where user scored lowest or hasn't attempted |
| **Cumulative voice memo timeline** | Multiple voice clips attached to a session, each associated with a canvas state | High | Requires new DB model for voice clips, blob storage, playback UI |
| **Shape grouping / subsystem boundaries** | Draw a boundary around a group of shapes to label it "Auth Service" or "Data Pipeline" | Med | tldraw supports groups natively; need custom group shape with label for SemanticGraph |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time continuous speech recognition** | Browser SpeechRecognition sends audio to Google servers, spotty cross-browser support (Firefox partial), privacy concern, unreliable for technical terms | Use MediaRecorder for audio capture + server-side Whisper/Gemini transcription, or simple voice memos without transcription in v1 |
| **Leaderboards / social comparison** | Out of scope per PROJECT.md; premature before product validation; can demotivate users | Personal progress only — show improvement over own past scores |
| **Complex drag-and-drop dashboard customization** | Over-engineering for 10-user launch target; significant dev time for marginal value | Fixed dashboard layout with sensible defaults |
| **Auto-playing voice back during scoring** | Adds latency and complexity to the scoring flow; users want to control playback | Manual playback button on each voice memo |
| **Mobile canvas editing** | tldraw is fundamentally a desktop experience; touch targets too small for architecture diagrams | Show read-only canvas preview on mobile; editing requires desktop |
| **AI voice responses (TTS)** | Cool but expensive, adds latency, not core value prop | Text chat is sufficient; voice is input-only |

## Feature Dependencies

```
Dashboard page → Session history list → Score summary display
Voice recording (MediaRecorder) → Voice storage (DB/blob) → Voice transcription → Feed to AI context
Text labels as context → graph-parser update → AI prompt update (ai.ts)
Enhanced components → ShapeUtil classes → graph-parser category mapping → AI prompt awareness
Canvas tutorial → Dashboard exists (tutorial launches from first session start)
Progress analytics → Multiple scored sessions exist → Chart component
Per-category trends → ScoreResult breakdown stored → Analytics aggregation
```

## MVP Recommendation

**Phase 1 — Dashboard and stability (table stakes):**
1. Post-login dashboard with session list and score summaries
2. Responsive layout fixes
3. Text labels as semantic context (graph-parser change)
4. Duplicate UI control cleanup

**Phase 2 — Enhanced interview experience:**
1. Canvas first-time tutorial
2. Enhanced component library (6-8 new shapes)
3. Voice memo recording (MediaRecorder, store as blob, no transcription yet)
4. AI token optimization

**Phase 3 — Analytics and voice intelligence:**
1. Progress analytics with score trend charts
2. Per-category breakdown trends
3. Voice transcription fed to AI (Whisper API or Gemini audio)
4. Question difficulty recommendations

**Defer:** Cumulative voice memo timeline, shape grouping/subsystem boundaries — nice-to-have post-launch.

## Implementation Notes

### Dashboard
- Use Next.js App Router server component to fetch sessions on load
- Layout: left sidebar nav (questions, history, billing), main area with cards
- Each session card shows: question title, last score (color-coded), attempt count, last active date
- No client-side data fetching for initial load — server render for speed

### Voice Recording
- **MediaRecorder API** over Web Speech API because: works offline, cross-browser (all modern browsers), captures actual audio for later transcription, no privacy leak to Google
- Store audio as WebM/Opus blobs (smallest size, browser-native codec)
- v1: Store in DB as base64 in InterviewSession (sessions are small, <30s clips)
- v2: Move to Supabase Storage if blobs get large
- Transcription: Gemini 1.5 Flash accepts audio natively — send blob + "transcribe this" — cheaper than Whisper API and already in stack

### Analytics
- Recharts (lightweight, React-native, good for line/radar charts)
- Radar chart for category breakdown (scalability, reliability, tradeoffs, completeness)
- Line chart for score over time per question
- All data already exists in InterviewSession.scoreResult — just needs aggregation query

### Enhanced Components
- Missing shapes based on common system design patterns:
  - **SearchEngine** (Elasticsearch/Solr) — new category
  - **StreamProcessor** (Kafka Streams/Flink) — extends Queue concept
  - **DNS** — networking category
  - **Firewall/WAF** — security category
  - **Container/K8s** — compute category (alongside existing Server)
  - **Serverless/Lambda** — compute category
  - **Monitoring** (Prometheus/Datadog) — observability category
  - **ServiceMesh** (Istio/Envoy) — networking category
- Each follows existing ShapeUtil pattern: define props, getDefaultProps, getGeometry, component, indicator
- Register in shapes/index.ts array (must be outside React components per tldraw docs)
- Update graph-parser category mapping for new shape types

## Sources

- [tldraw Custom Shapes](https://tldraw.dev/examples/custom-shape)
- [tldraw Performance](https://tldraw.dev/sdk-features/performance)
- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [SaaS Dashboard Best Practices](https://www.context.dev/blog/dashboard-design-best-practices)
- [Gamification Patterns for SaaS](https://dev.to/gerus_team/5-gamification-patterns-that-actually-move-saas-metrics-not-just-vanity-numbers-3h95)
