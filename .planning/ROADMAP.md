# Roadmap: SysDraw Production Push

## Overview

SysDraw needs to go from "working prototype" to "production-ready for 10 users." The build order follows the dependency chain: stabilize the foundation, build the dashboard landing page, enrich the interview experience, add analytics on top of scored sessions, and finally layer in experimental voice explanations. Each phase delivers a complete, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Stability & Performance** - Eliminate crashes, optimize load times, enforce AI cost guardrails
- [ ] **Phase 2: Dashboard & Session Management** - Post-login landing page with session history and responsive layout
- [ ] **Phase 3: Enhanced Interview Experience** - New vendor shapes, text label context, canvas tutorial, clean UI
- [ ] **Phase 4: Analytics & Progress Tracking** - Score trends, category breakdowns, filterable progress views
- [ ] **Phase 5: Voice Explanations** - Record, transcribe, edit, and feed voice memos to AI context

## Phase Details

### Phase 1: Stability & Performance
**Goal**: The app is crash-free, fast, and cost-efficient enough to support real users
**Depends on**: Nothing (first phase)
**Requirements**: STAB-01, STAB-02, STAB-03, STAB-04, AICOST-01, AICOST-02, AICOST-03, AICOST-04
**Success Criteria** (what must be TRUE):
  1. User can drag, draw, and delete shapes on canvas without crashes or freezes
  2. User experiences page loads under 3 seconds on a typical connection
  3. User receives hint responses within 10 seconds of requesting one
  4. Canvas save events do not exhaust connections (debounced, no save storms)
  5. AI endpoints use appropriate models (Haiku for hints, Sonnet for scoring) with token limits enforced
**Plans:** 2 plans
Plans:
- [x] 01-01-PLAN.md — Fix save storms, Gemini model bug, atomic daily limits, hasGraphChanged optimization
- [x] 01-02-PLAN.md — Dynamic tldraw import, token budget utility, AI route verification

### Phase 2: Dashboard & Session Management
**Goal**: Users land on a useful home page after login and can navigate their session history
**Depends on**: Phase 1
**Requirements**: ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-06, INTERVIEW-05
**Success Criteria** (what must be TRUE):
  1. User lands on dashboard (not question list) after logging in
  2. User sees their past interview sessions with scores on the dashboard
  3. User sees a score summary with total, average, and trend
  4. User can click a session to view details or retake
  5. All pages render correctly on mobile, tablet, and desktop
**Plans:** 3 plans
Plans:
- [x] 02-01-PLAN.md — Shared utilities (src/lib/utils.ts), HistorySession type, /api/history pro-gate removal
- [ ] 02-02-PLAN.md — Dashboard page (SessionCard, StatsBar components, /dashboard route)
- [ ] 02-03-PLAN.md — Auth redirect on /, /history redirect, MobileNotice, canvas controls verification

### Phase 3: Enhanced Interview Experience
**Goal**: The interview loop is richer with more components, semantic text context, and guided onboarding
**Depends on**: Phase 2
**Requirements**: INTERVIEW-01, INTERVIEW-02, INTERVIEW-03, INTERVIEW-04, ONBOARD-05
**Success Criteria** (what must be TRUE):
  1. User can place 6-8 new vendor shapes (DNS, Container, Serverless, Monitoring, Firewall, StreamProcessor, ServiceMesh, SearchEngine) on canvas
  2. User can drag, snap, and align shapes for precise placement
  3. Text labels written on canvas appear in AI hint and score responses (AI acknowledges user annotations)
  4. First-time canvas visitor sees an interactive tutorial; returning visitors do not
**Plans**: TBD
**UI hint**: yes

### Phase 4: Analytics & Progress Tracking
**Goal**: Users can see how they are improving over time with visual score analytics
**Depends on**: Phase 2
**Requirements**: ANALYTICS-01, ANALYTICS-02, ANALYTICS-03, ANALYTICS-04
**Success Criteria** (what must be TRUE):
  1. User sees a line chart of score trends across sessions on the dashboard
  2. User sees a radar/category breakdown chart (reliability, scalability, tradeoffs, completeness)
  3. User can filter analytics by question or date range
  4. Session detail page shows per-category score breakdown
**Plans**: TBD
**UI hint**: yes

### Phase 5: Voice Explanations
**Goal**: Users can verbally explain their design decisions and have that context improve AI feedback
**Depends on**: Phase 1
**Requirements**: VOICE-01, VOICE-02, VOICE-03, VOICE-04
**Success Criteria** (what must be TRUE):
  1. User can record a voice memo during an interview session
  2. Voice memo is transcribed and shown as editable text
  3. Edited transcript persists across page refreshes
  4. AI hint and score responses incorporate the voice transcript (AI references what user explained verbally)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Stability & Performance | 0/2 | Not started | - |
| 2. Dashboard & Session Management | 0/3 | Not started | - |
| 3. Enhanced Interview Experience | 0/TBD | Not started | - |
| 4. Analytics & Progress Tracking | 0/TBD | Not started | - |
| 5. Voice Explanations | 0/TBD | Not started | - |
