# Phase 2: Dashboard & Session Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 02-dashboard-session-management
**Areas discussed:** Dashboard routing, Session card content, Score summary display, Responsiveness + canvas cleanup

---

## Dashboard Routing

| Option | Description | Selected |
|--------|-------------|----------|
| New /dashboard route | Logged-in users redirected from / to /dashboard. Marketing page stays pure. | ✓ |
| / transforms when logged in | Current home page conditionally renders dashboard vs marketing based on auth | |

**User's choice:** New /dashboard route
**Notes:** Prompt/question grid also lives on /dashboard (not a separate /questions route). Single destination after login: stats → history → start new.

---

## Prompt Placement

| Option | Description | Selected |
|--------|-------------|----------|
| On /dashboard itself | Dashboard has sessions + question picker on same page | ✓ |
| Separate /questions route | Dashboard links out to /questions for starting new sessions | |

**User's choice:** On /dashboard itself

---

## Session Card Content

| Option | Description | Selected |
|--------|-------------|----------|
| Score + question + date | Title, difficulty badge, score (or "Not scored"), date, Retake button | ✓ |
| Score + question + date + hints used | Same plus hints used count | |

**User's choice:** Score + question + date (compact)

---

## Retake Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Resume existing session | Navigate to /session/[existing-id], all state preserved | ✓ |
| Start fresh reset | Clear canvas/chat/scores, needs new reset API endpoint | |

**User's choice:** Resume existing session

---

## Score Summary

| Option | Description | Selected |
|--------|-------------|----------|
| Compact stats bar | Single row: total sessions, avg score, best score | ✓ |
| Summary section with trend | Stat boxes + trend indicator (improving/declining) | |

**User's choice:** Compact stats bar (total, avg, best)

---

## Responsiveness

| Option | Description | Selected |
|--------|-------------|----------|
| All pages readable on mobile | Dashboard + marketing responsive, canvas gets desktop notice | ✓ |
| Full mobile canvas support | Touch/pinch canvas on mobile, tldraw touch API | |

**User's choice:** Dashboard and marketing responsive; canvas = desktop notice on mobile

---

## Canvas Controls Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Remove tldraw's built-in toolbar | Keep VendorToolbar, hide tldraw DefaultToolbar/UndoRedoGroup | ✓ |
| You decide | Claude determines which set to remove at implementation | |

**User's choice:** Keep custom VendorToolbar, remove tldraw's built-in duplicate controls

---

## Deferred Ideas

- Score trend chart → Phase 4
- Per-category session detail → Phase 4
- Touch-native mobile canvas → future phase
