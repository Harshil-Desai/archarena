# SysDraw — Production Push

## What This Is

SysDraw is a system design interview practice SaaS where users pick a question, draw their architecture using vendor-specific components on an interactive canvas, and an AI interviewer provides hints and scoring in real-time. We're pushing toward production by fixing stability/performance issues, enriching the interview experience (better components, voice explanations, analytics), and refining the UI to feel polished and responsive.

## Core Value

Users can practice system design with **immediate, interactive AI feedback** — not a static checker, but a real interviewer asking follow-ups and scoring their work.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Authentication with Google/GitHub OAuth — existing (NextAuth v5)
- ✓ Interactive tldraw canvas with vendor shapes — existing
- ✓ AI hints for diagrams — existing (Haiku via Anthropic/Gemini)
- ✓ AI scoring with breakdown — existing (Sonnet/Gemini Pro)
- ✓ Session persistence and limit enforcement — existing (DB-driven)
- ✓ Tier system (Free/Pro/Premium) — existing (LemonSqueezy)
- ✓ Interview session flow — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] **Dashboard/home page after login** — Users land on dashboard, not jumped straight to questions
- [ ] **Stability & performance fixes** — Eliminate crashes, reduce slow load times
- [ ] **Responsive UI across all pages** — Fix broken responsiveness
- [ ] **Clean duplicate UI controls** — Remove duplicate undo/redo/delete buttons
- [ ] **Voice explanation feature** — Users can record cumulative voice memos explaining their diagram choices
- [ ] **Text labels as semantic context** — Parser treats all canvas text as component context, not just shapes
- [ ] **Enhanced component library** — Complete vendor coverage (databases, caching, messaging, compute, etc.) + any missing categories
- [ ] **Better drawing UX** — Improved shape interactions (drag/snap/align), better drawing experience
- [ ] **Canvas first-time tutorial** — One-time interactive tutorial when users enter canvas for first time
- [ ] **User progress analytics** — Users can track their interview attempts, scores, and improvement over time
- [ ] **AI token optimization** — Reduce input/output tokens to manage costs on free tier (rate limits, pricing, token efficiency)

### Out of Scope

- Social/community features (leaderboards, sharing) — Deferring until product validation and user response is clear
- Mobile app — Web-first only
- Real-time collaboration — Not in v1
- Advanced moderation tools — Not vital for early users

## Context

**Existing strengths:** Well-architected codebase with clear separation of concerns (SemanticGraph parser, two-tier AI model system, DB-driven limits, Zustand state). NextAuth/Prisma/PostgreSQL infrastructure solid. tldraw integration mature.

**Production blockers:** Stability issues (crashes, slow loads), broken onboarding flow (no dashboard), UI polish gaps (responsiveness, duplicate controls), and AI cost management needed before heavy investment.

**User gap:** No way to track progress or see their improvement over time. No context provided with diagrams (only shapes, not labels). No voice explanations, so AI has less context. No guidance on first visit to canvas.

**Constraint:** Few weeks to launch, success = 10 users without major incidents.

## Constraints

- **Timeline**: Launch in few weeks
- **AI costs**: Avoid expensive API plans until paying users justify investment — must optimize token usage on free tier
- **Data scope**: Simple data, no strict integrity requirements
- **Launch readiness**: 10 users without major incidents = production ready

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dashboard before interview | Better onboarding flow, clear user path, not jumping straight to questions | — Pending |
| Voice memos over continuous speech | Simpler to build, less complex, user can review/edit before submission | — Pending |
| Text labels as universal context | Richer semantic understanding, labels become first-class context like shapes | — Pending |
| Token optimization before feature expansion | Must manage costs on free tier before investing in expensive AI features | — Pending |
| One-time tutorial instead of repeated | Respect user time, only for first canvas visit | — Pending |
| Analytics before social features | Understand user behavior before building community features | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state (users, feedback, metrics)

---
*Last updated: 2026-04-15 after initialization*
