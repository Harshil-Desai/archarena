# Phase 2: Dashboard & Session Management - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Post-login landing experience: a `/dashboard` route that logged-in users land on, showing their past interview sessions with scores, a compact score summary, and a prompt grid to start new sessions. Also covers responsive layout fixes across the site (ONBOARD-06) and removing duplicate canvas UI controls (INTERVIEW-05).

New capabilities (analytics charts, voice, tutorial) are out of scope — those belong to Phases 3–5.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Architecture
- **D-01:** A new `/dashboard` route is created. Logged-in users are redirected there from `/`. The current `/` page stays as pure marketing for logged-out visitors — no conditional rendering based on auth state on the marketing page.
- **D-02:** The `/dashboard` page contains three sections in order: (1) compact score summary stats bar, (2) past sessions list, (3) question/prompt picker grid. All on one page — no separate `/questions` route.
- **D-03:** The existing `/history` page (partial implementation) should be replaced or consolidated into `/dashboard`.

### Session Cards
- **D-04:** Each past session card shows: question title, difficulty badge, score (or "Not scored" if null), date, and a Retake button.
- **D-05:** No hints-used count on the card — keep it compact.
- **D-06:** "Retake" navigates to `/session/[existing-session-id]`. It resumes the existing session (canvas state, chat history, limits preserved). This matches how `/api/session/start` already works with upsert on `userId+promptId` — no new reset endpoint needed.

### Score Summary
- **D-07:** A compact horizontal stats bar above the sessions list: **total sessions**, **average score**, **best score**. No trend indicator in this phase (that's Phase 4 analytics).

### Responsiveness (ONBOARD-06)
- **D-08:** Target breakpoints: 375px (mobile) and 768px (tablet). Dashboard and marketing page must be fully responsive with single-column layouts on mobile.
- **D-09:** Session/canvas page on mobile: show a "use desktop for the best experience" notice rather than building touch-friendly canvas controls. Canvas itself is not the responsive focus.

### Canvas Controls Cleanup (INTERVIEW-05)
- **D-10:** Remove tldraw's built-in toolbar/UndoRedoGroup from the canvas. Keep the custom `VendorToolbar` (which already has undo, redo, delete). Result: one set of controls, no duplicates.

### Claude's Discretion
- Empty state design for dashboard when user has no sessions yet
- Exact Tailwind classes and spacing for the stats bar and session cards
- Auth redirect implementation (middleware vs client-side `useEffect`)
- Whether `/history` is deleted or redirects to `/dashboard`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-06, INTERVIEW-05 define the acceptance criteria for this phase

### Existing Implementation
- `src/app/page.tsx` — Current home page (marketing + prompt grid); logged-in redirect should be added here
- `src/app/history/page.tsx` — Existing partial session history implementation; consolidate into `/dashboard`
- `src/app/session/[id]/page.tsx` — Session page; contains canvas controls cleanup target
- `src/components/canvas/toolbar/VendorToolbar.tsx` — Custom toolbar to KEEP (has undo/redo/delete)
- `src/components/canvas/InterviewCanvas.tsx` — Canvas wrapper; tldraw toolbar suppression happens here
- `src/app/api/session/start/route.ts` — Upsert logic: `@@unique([userId, promptId])` means retake = resume

### Database Schema
- `prisma/schema.prisma` — `InterviewSession` model: `id`, `promptId`, `hintsUsed`, `scoresUsed`, `scoreResult`, `status`, `createdAt`, `updatedAt` — fields available for session card display

### Design System
- `src/app/globals.css` — Base dark theme (bg-gray-950)
- `src/lib/prompts.ts` — `PROMPTS` array, `FREE_PROMPT_COUNT` — needed for prompt grid on dashboard

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/history/page.tsx` — Already fetches `/api/session/history`, renders session rows. Card design needs update per D-04 but the data fetch pattern is reusable.
- `src/components/auth/UserMenu.tsx` — Existing auth-aware nav component, reuse in dashboard navbar.
- `src/components/ui/ProBadge.tsx` — Tier badge component, reuse on dashboard if needed.
- `PromptCard` component in `src/app/page.tsx` — Full prompt card implementation (difficulty badge, lock overlay, animation). Extract or reuse for the prompt grid section on `/dashboard`.
- `difficultyBadge()` helper — Already in both `page.tsx` and `history/page.tsx`, candidate for extraction to `src/lib/utils.ts`.

### Established Patterns
- Dark theme: `bg-gray-950` base, `border-gray-800`, semantic color classes (`text-emerald-300`, `text-amber-400`)
- Font: `font-[family-name:var(--font-display)]` for headings
- Cards: `rounded-2xl border border-gray-800/60 bg-gray-950/40 backdrop-blur-md`
- Auth check: `const { data: session, status } = useSession()` in client components
- API routes: session fetching uses NextAuth `auth()` as first operation
- Responsive: `lg:` breakpoints already used in `page.tsx`; `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` pattern for prompt grid

### Integration Points
- `/dashboard` connects to: `/api/session/history` (existing), `/api/session/start` (existing for starting sessions from prompt grid)
- Auth redirect: middleware at `src/middleware.ts` protects `/session/*` and `/api/*` — `/dashboard` needs similar protection or client-side redirect
- `InterviewSession.scoreResult` is JSON — need to type-cast to `{ score: number; ... }` for display

</code_context>

<specifics>
## Specific Ideas

- Dashboard layout: score summary bar → past sessions list → prompt picker (all on one scrollable page)
- Session card: compact row/card showing question title + difficulty badge + score + date + Retake button
- "Retake" = navigate to existing session URL (no reset)
- Mobile canvas: "best experienced on desktop" notice, no touch canvas work in this phase

</specifics>

<deferred>
## Deferred Ideas

- Score trend charts (line chart over sessions) — Phase 4 (ANALYTICS-01)
- Per-category score breakdown on session detail — Phase 4 (ANALYTICS-04)
- Full mobile-native canvas with touch/pinch — future phase
- Session sharing/export — out of scope for v1

</deferred>

---

*Phase: 02-dashboard-session-management*
*Context gathered: 2026-04-16*
