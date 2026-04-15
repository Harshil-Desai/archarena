# Requirements: SysDraw Production Push

**Defined:** 2026-04-15
**Core Value:** Users can practice system design with immediate, interactive AI feedback — not a static checker, but a real interviewer asking follow-ups and scoring their work.

## v1 Requirements

Requirements for production launch. Each maps to roadmap phases.

### Stability & Performance

- [ ] **STAB-01**: Canvas operations (drag, draw, delete) complete without crashes under 50 concurrent users
- [ ] **STAB-02**: Session save events debounced to prevent connection exhaustion
- [ ] **STAB-03**: Page load times under 3 seconds on 4G networks
- [ ] **STAB-04**: Hint and score API responses complete within 10 seconds

### Onboarding & Dashboard

- [ ] **ONBOARD-01**: User lands on dashboard after login (not jumped to questions)
- [ ] **ONBOARD-02**: Dashboard shows list of past interview sessions with scores
- [ ] **ONBOARD-03**: Dashboard displays score summary (total, average, trend)
- [ ] **ONBOARD-04**: User can click session to view full details and retake interview
- [ ] **ONBOARD-05**: Canvas page shows first-time tutorial on first visit only
- [ ] **ONBOARD-06**: Website is responsive on mobile, tablet, and desktop

### Enhanced Interview Experience

- [ ] **INTERVIEW-01**: Canvas has drag/snap/align tools for better shape placement
- [ ] **INTERVIEW-02**: Canvas displays 6-8 new vendor shapes (SearchEngine, DNS, Container, Serverless, Monitoring, Firewall, StreamProcessor, ServiceMesh)
- [ ] **INTERVIEW-03**: All text labels on canvas are parsed as semantic context to nearby shapes
- [ ] **INTERVIEW-04**: Text labels appear in AI hint/score context (AI sees what user wrote)
- [ ] **INTERVIEW-05**: UI has only one set of undo/redo/delete buttons (duplicates removed)

### Voice Explanations

- [ ] **VOICE-01**: User can record voice memo explaining their diagram (one-time per session)
- [ ] **VOICE-02**: Voice memo is transcribed to text and shown as editable transcript
- [ ] **VOICE-03**: Transcript persists and is editable by user (cumulative updates)
- [ ] **VOICE-04**: Transcript is sent to AI hint and score endpoints for enriched context

### Analytics & Progress Tracking

- [ ] **ANALYTICS-01**: Dashboard shows user's score trends (line chart over sessions)
- [ ] **ANALYTICS-02**: Dashboard shows category breakdown (reliability, scalability, tradeoffs, completeness radar chart)
- [ ] **ANALYTICS-03**: User can filter analytics by question or date range
- [ ] **ANALYTICS-04**: Session detail page shows score breakdown by category

### AI Cost Management

- [ ] **AICOST-01**: Voice transcript limited to 200 tokens max to prevent cost explosion
- [ ] **AICOST-02**: Semantic graph context limited to essential shapes + labels (no pixel data)
- [ ] **AICOST-03**: Hint endpoint uses Haiku/Flash model (fast, cheap)
- [ ] **AICOST-04**: Score endpoint uses Sonnet model (thorough but cost-controlled)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- Real-time collaboration (multiple users on same canvas)
- Social sharing (leaderboards, public profiles)
- Video transcription for voice explanations
- Custom component library creation
- API for third-party integrations

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first only for v1 |
| Real-time chat | Deferred to v2, not core to product |
| Custom training data | Use standard Claude/Gemini models |
| Advanced admin features | Not needed until 100+ users |
| Detailed audit logs | Data integrity not a concern yet |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAB-01 | Phase 1 | Pending |
| STAB-02 | Phase 1 | Pending |
| STAB-03 | Phase 1 | Pending |
| STAB-04 | Phase 1 | Pending |
| ONBOARD-01 | Phase 2 | Pending |
| ONBOARD-02 | Phase 2 | Pending |
| ONBOARD-03 | Phase 2 | Pending |
| ONBOARD-04 | Phase 2 | Pending |
| ONBOARD-05 | Phase 3 | Pending |
| ONBOARD-06 | Phase 2 | Pending |
| INTERVIEW-01 | Phase 3 | Pending |
| INTERVIEW-02 | Phase 3 | Pending |
| INTERVIEW-03 | Phase 3 | Pending |
| INTERVIEW-04 | Phase 3 | Pending |
| INTERVIEW-05 | Phase 2 | Pending |
| VOICE-01 | Phase 5 | Pending |
| VOICE-02 | Phase 5 | Pending |
| VOICE-03 | Phase 5 | Pending |
| VOICE-04 | Phase 5 | Pending |
| ANALYTICS-01 | Phase 4 | Pending |
| ANALYTICS-02 | Phase 4 | Pending |
| ANALYTICS-03 | Phase 4 | Pending |
| ANALYTICS-04 | Phase 4 | Pending |
| AICOST-01 | Phase 1 | Pending |
| AICOST-02 | Phase 1 | Pending |
| AICOST-03 | Phase 1 | Pending |
| AICOST-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 after research*
