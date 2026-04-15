---
phase: 2
slug: dashboard-session-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — no test framework in package.json |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | ONBOARD-01 | — | Auth redirect sends users to /dashboard, not / | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | ONBOARD-02 | — | Dashboard fetches sessions for authenticated user only | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | ONBOARD-03 | — | Score summary aggregates correctly | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-01-04 | 01 | 2 | ONBOARD-04 | — | Session detail route checks ownership before returning data | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-01-05 | 01 | 2 | ONBOARD-06 | — | Responsive layout renders on mobile/tablet/desktop | manual | Visual inspection at 375px, 768px, 1280px | N/A | ⬜ pending |
| 2-01-06 | 01 | 2 | INTERVIEW-05 | — | tldraw toolbar/StylePanel/MainMenu remain hidden | manual | Open session page, verify no default tldraw UI visible | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test framework detected — all verification is type-check + lint + manual.
- TypeScript strict mode (`npx tsc --noEmit`) covers type safety for all new code.

*No Wave 0 test file stubs required — no test framework installed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive layout | ONBOARD-06 | No browser test framework | Resize browser to 375px, 768px, 1280px and verify layout |
| tldraw UI hidden | INTERVIEW-05 | DOM/visual check | Open /session/[id], confirm no default tldraw toolbar/menus |
| Login redirect to dashboard | ONBOARD-01 | Next.js redirect behavior | Log in via Google/GitHub, confirm landing on /dashboard |
| Score trend display | ONBOARD-03 | Visual/UX check | Create 2+ sessions with scores, verify trend indicator shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
