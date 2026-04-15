# Phase 2: Dashboard & Session Management - Research

**Researched:** 2026-04-16
**Domain:** Next.js App Router routing, React component reuse, tldraw toolbar suppression, responsive Tailwind layouts
**Confidence:** HIGH

## Summary

Phase 2 adds a `/dashboard` route as the post-login landing page, consolidates the existing `/history` page into it, and cleans up duplicate canvas controls. The work is primarily UI composition — no new API endpoints need to be created. The `/api/history` endpoint already exists but has a pro-gate that must be removed (or bypassed) for the dashboard's session list to work for free-tier users too.

The existing codebase has strong reuse candidates: `PromptCard` and `difficultyBadge()` from `src/app/page.tsx`, the data fetch + skeleton loading pattern from `src/app/history/page.tsx`, and `UserMenu` from `src/components/auth/UserMenu.tsx`. The main work is (1) building the `/dashboard` page composing these pieces, (2) modifying `src/app/page.tsx` to redirect logged-in users to `/dashboard`, (3) removing the pro-gate on the history API for dashboard use, and (4) verifying tldraw's `Toolbar` and `UndoRedoGroup` are fully suppressed in `InterviewCanvas.tsx`.

**Primary recommendation:** Build `/dashboard` as a single server-or-client component page with three sections, redirect `/` → `/dashboard` for authenticated users via middleware or page-level `useEffect`, and consolidate `/history` by either deleting it or adding a redirect.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** A new `/dashboard` route is created. Logged-in users are redirected there from `/`. The current `/` page stays as pure marketing for logged-out visitors — no conditional rendering based on auth state on the marketing page.
- **D-02:** The `/dashboard` page contains three sections in order: (1) compact score summary stats bar, (2) past sessions list, (3) question/prompt picker grid. All on one page — no separate `/questions` route.
- **D-03:** The existing `/history` page (partial implementation) should be replaced or consolidated into `/dashboard`.
- **D-04:** Each past session card shows: question title, difficulty badge, score (or "Not scored" if null), date, and a Retake button.
- **D-05:** No hints-used count on the card — keep it compact.
- **D-06:** "Retake" navigates to `/session/[existing-session-id]`. It resumes the existing session (canvas state, chat history, limits preserved). This matches how `/api/session/start` already works with upsert on `userId+promptId` — no new reset endpoint needed.
- **D-07:** A compact horizontal stats bar above the sessions list: **total sessions**, **average score**, **best score**. No trend indicator in this phase (that's Phase 4 analytics).
- **D-08:** Target breakpoints: 375px (mobile) and 768px (tablet). Dashboard and marketing page must be fully responsive with single-column layouts on mobile.
- **D-09:** Session/canvas page on mobile: show a "use desktop for the best experience" notice rather than building touch-friendly canvas controls. Canvas itself is not the responsive focus.
- **D-10:** Remove tldraw's built-in toolbar/UndoRedoGroup from the canvas. Keep the custom `VendorToolbar` (which already has undo, redo, delete). Result: one set of controls, no duplicates.

### Claude's Discretion

- Empty state design for dashboard when user has no sessions yet
- Exact Tailwind classes and spacing for the stats bar and session cards
- Auth redirect implementation (middleware vs client-side `useEffect`)
- Whether `/history` is deleted or redirects to `/dashboard`

### Deferred Ideas (OUT OF SCOPE)

- Score trend charts (line chart over sessions) — Phase 4 (ANALYTICS-01)
- Per-category score breakdown on session detail — Phase 4 (ANALYTICS-04)
- Full mobile-native canvas with touch/pinch — future phase
- Session sharing/export — out of scope for v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBOARD-01 | User lands on dashboard after login (not jumped to questions) | Redirect from `/` for authenticated users; middleware or page-level `useEffect` both viable |
| ONBOARD-02 | Dashboard shows list of past interview sessions with scores | `/api/history` exists; pro-gate must be removed for free-tier users |
| ONBOARD-03 | Dashboard displays score summary (total, average, best score) | Computed from the same `/api/history` response on the client; no new endpoint needed |
| ONBOARD-04 | User can click session to view full details and retake interview | "Retake" = navigate to `/session/[id]`; upsert semantics already handle resume |
| ONBOARD-06 | Website is responsive on mobile, tablet, and desktop | Tailwind responsive utilities; mobile canvas gets a notice banner per D-09 |
| INTERVIEW-05 | UI has only one set of undo/redo/delete buttons (duplicates removed) | `InterviewCanvas.tsx` already sets `Toolbar: null` — verify `UndoRedoGroup` is also suppressed |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth redirect (/ → /dashboard) | Frontend Server (middleware or page) | — | Auth state is available server-side via NextAuth; page-level client redirect is fallback |
| Dashboard data fetch (sessions list) | API / Backend (`/api/history`) | — | Auth-gated, must read from DB |
| Stats computation (total, avg, best) | Browser / Client | — | Derived from the `/api/history` response payload; no extra query needed |
| Session card UI | Browser / Client | — | Presentational component, no server interaction |
| Prompt picker grid | Browser / Client | — | Reuse `PromptCard` from page.tsx; same data from `src/lib/prompts.ts` |
| Mobile canvas notice | Browser / Client | — | CSS viewport detection (`md:hidden`) or `useMediaQuery` hook |
| Canvas toolbar cleanup | Browser / Client | — | tldraw component override already in `InterviewCanvas.tsx` |

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.2.1 | `/dashboard` route, middleware redirect | Project standard |
| next-auth v5 | 5.0.0-beta.30 | Auth state in middleware + client components | Project standard |
| Tailwind CSS | 4.2.2 | Responsive layouts, dark theme | Project standard |
| Prisma | 7.6.0 | Session data reads via `/api/history` | Project standard |
| Zustand | 5.0.12 | `setActivePrompt` for retake flow | Project standard |
| lucide-react | 1.7.0 | `Monitor` icon for mobile canvas notice (per UI-SPEC) | Project standard |

No new packages required for this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (authenticated user)
  │
  ├─ GET /  ──────────────────────────────► page.tsx checks auth
  │                                          → if logged in: redirect to /dashboard
  │                                          → if logged out: render marketing page
  │
  ├─ GET /dashboard ──────────────────────► dashboard/page.tsx (new)
  │     │                                     renders Nav + StatsBar + SessionList + PromptGrid
  │     │
  │     └─ fetch /api/history ────────────► api/history/route.ts
  │                                          auth() check → query InterviewSession
  │                                          returns { sessions[] }
  │                                          (pro-gate REMOVED for dashboard use)
  │
  ├─ click "Retake" ──────────────────────► router.push(`/session/${session.id}`)
  │
  └─ GET /session/[id] (mobile) ──────────► session page renders MobileNotice banner
                                             if viewport < 768px
```

### Recommended Project Structure

```
src/app/
├── page.tsx                    # MODIFIED: redirect authenticated users to /dashboard
├── dashboard/
│   └── page.tsx                # NEW: dashboard page
├── history/
│   └── page.tsx                # REPLACE with redirect to /dashboard or delete
└── api/
    └── history/
        └── route.ts            # MODIFIED: remove pro-gate (or add new /api/session/history)

src/components/
├── dashboard/
│   ├── StatsBar.tsx            # NEW: total/avg/best stats
│   └── SessionCard.tsx         # NEW: session card with retake button
├── canvas/
│   └── InterviewCanvas.tsx     # MODIFIED: verify UndoRedoGroup suppressed
└── session/
    └── MobileNotice.tsx        # NEW: "use desktop" banner for mobile
```

### Pattern 1: Auth Redirect on Marketing Page

**What:** When an authenticated user lands on `/`, immediately redirect to `/dashboard` using `useEffect` + `useSession`.

**When to use:** D-01 requires marketing page stays pure for logged-out visitors. Client-side redirect in the existing `"use client"` page.tsx is the least-invasive change — no middleware changes needed.

**Example:**

```typescript
// In src/app/page.tsx, inside the Home component
const { data: session, status } = useSession();
const router = useRouter();

useEffect(() => {
  if (status === "authenticated") {
    router.replace("/dashboard");
  }
}, [status, router]);

// Return null or a minimal loading state during redirect
if (status === "authenticated") return null;
```

**Alternative:** Next.js middleware (`src/middleware.ts` — currently does not exist as a file). A middleware approach is cleaner but adds a new file. Either works; client redirect is lower risk given the existing page structure.

[ASSUMED] — Both approaches work with NextAuth v5; middleware approach requires `auth()` from `@/auth` to be called in the middleware file.

### Pattern 2: Dashboard Data Fetch

**What:** `/dashboard` page fetches `/api/history` on mount, derives stats from the response.

**When to use:** All session data for the three dashboard sections (stats bar, session list, prompt grid) — the prompt grid data comes from `PROMPTS` constant (no API call needed).

**Example:**

```typescript
// In dashboard/page.tsx
const [sessions, setSessions] = useState<HistorySession[]>([]);

useEffect(() => {
  fetch("/api/history")
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => setSessions(data.sessions ?? []))
    .catch(() => setPageState("error"));
}, []);

// Stats derived from sessions array — no extra API call
const totalSessions = sessions.length;
const scoredSessions = sessions.filter(s => s.scoreResult?.score != null);
const avgScore = scoredSessions.length
  ? Math.round(scoredSessions.reduce((sum, s) => sum + s.scoreResult!.score, 0) / scoredSessions.length)
  : null;
const bestScore = scoredSessions.length
  ? Math.max(...scoredSessions.map(s => s.scoreResult!.score))
  : null;
```

[VERIFIED: codebase] — `/api/history` returns `{ sessions }` array. The existing `HistorySession` interface in `history/page.tsx` can be moved to `src/types/index.ts` per project conventions.

### Pattern 3: Retake Navigation

**What:** "Retake" button navigates to existing session URL. `InterviewSession` has `@@unique([userId, promptId])` so each user-question pair always resolves to the same session ID.

**When to use:** Session cards per D-06.

**Example:**

```typescript
// In SessionCard or dashboard page
const handleRetake = (s: HistorySession) => {
  const prompt = PROMPTS.find(p => p.id === s.promptId);
  if (prompt) setActivePrompt(prompt); // Zustand — set for canvas init
  router.push(`/session/${s.id}`);
};
```

[VERIFIED: codebase] — `handleResume` in `history/page.tsx` uses exactly this pattern. Copy it to dashboard.

### Pattern 4: tldraw Toolbar Suppression (INTERVIEW-05)

**What:** tldraw's `UndoRedoGroup` is part of the default `Toolbar` component. Since `Toolbar: null` is already set in `TLDRAW_COMPONENT_OVERRIDES`, the built-in undo/redo is already suppressed.

**Current state:** `InterviewCanvas.tsx` lines 25-37 already set:
```typescript
const TLDRAW_COMPONENT_OVERRIDES = {
  Toolbar: null,
  MainMenu: null,
  PageMenu: null,
  NavigationPanel: ZoomControls,
  ContextMenu: null,
  StylePanel: null,
  ActionsMenu: null,
  SharePanel: null,
  DebugPanel: null,
  HelpMenu: null,
} as const;
```

**Verification task:** Render the canvas in a browser and confirm no duplicate undo/redo/delete controls are visible alongside `VendorToolbar`. If the `KeyboardShortcutsDialog` surfaced via tldraw default renders any duplicate controls, it would show in the UI. INTERVIEW-05 may already be complete — the plan should include a verification step before any code change.

[VERIFIED: codebase] — `Toolbar: null` is already set. No code change may be needed.

### Anti-Patterns to Avoid

- **Adding auth logic to the marketing page with conditional rendering:** D-01 explicitly forbids this. Use a redirect, not a conditional render.
- **Computing stats server-side in a separate endpoint:** Over-engineering. The `/api/history` response already has all the data; compute on the client.
- **Duplicating `difficultyBadge()` again in dashboard files:** Extract it to `src/lib/utils.ts` (CONTEXT.md code_context notes this is already a candidate for extraction).
- **Trusting `session.user.tier` from the JWT for the history API:** The existing `/api/history` route already reads tier from DB. This pattern is correct; the only change is removing the free-tier gate for dashboard use.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative date formatting ("2 days ago") | Custom date math | `Intl.RelativeTimeFormat` (native browser API) | Zero deps, handles edge cases |
| Skeleton loading animation | Custom CSS | Tailwind `animate-pulse` | Already used in `history/page.tsx` |
| Auth-aware navigation | Custom session check | `useSession()` from `next-auth/react` | Consistent with rest of app |
| Score color coding | Custom logic | Copy `scoreColor()` from `history/page.tsx` | Already written, just extract |

---

## Common Pitfalls

### Pitfall 1: Pro-Gate on /api/history Blocks Dashboard

**What goes wrong:** The current `/api/history` route returns 403 for FREE tier users. The `/dashboard` page fetches this endpoint. Free users see an empty or error state even though they have session data.

**Why it happens:** `/api/history` was originally designed as a pro feature. Dashboard is available to all tiers.

**How to avoid:** Either (a) remove the pro-gate in `/api/history` — the simpler fix — or (b) create a new `/api/session/history` endpoint without the gate. Option (a) is preferred since CONTEXT.md says history is visible to all on the dashboard.

**Warning signs:** Dashboard shows "Couldn't load your sessions" for a FREE user who has completed sessions.

[VERIFIED: codebase] — `src/app/api/history/route.ts` lines 13-20 explicitly gate on `user.tier === "FREE"`.

### Pitfall 2: /history Page Left as Orphan

**What goes wrong:** Old `/history` route still exists alongside `/dashboard`, causing confusion. Users who bookmarked `/history` see a stale or inconsistent UI.

**Why it happens:** Forgetting to remove or redirect the old page.

**How to avoid:** Either delete `src/app/history/` entirely or add a redirect inside the page component: `redirect("/dashboard")` using Next.js `redirect()`.

### Pitfall 3: scoreResult JSON Shape Assumption

**What goes wrong:** `scoreResult` is a `Json?` field in Prisma. Accessing `.score` without a type guard causes runtime errors or TypeScript errors.

**Why it happens:** `Json` type from Prisma is `JsonValue` — not typed as the domain object.

**How to avoid:** Type-cast with a guard:
```typescript
function getScore(scoreResult: unknown): number | null {
  if (
    scoreResult !== null &&
    typeof scoreResult === "object" &&
    "score" in (scoreResult as object) &&
    typeof (scoreResult as { score: unknown }).score === "number"
  ) {
    return (scoreResult as { score: number }).score;
  }
  return null;
}
```

[VERIFIED: codebase] — `history/page.tsx` already has an inline guard: `s.scoreResult && typeof s.scoreResult === "object" && "score" in s.scoreResult`.

### Pitfall 4: Prompt Grid "Start" Navigates to Wrong Session

**What goes wrong:** The marketing page's `handlePromptClick` generates a new `nanoid(8)` and pushes to `/session/${id}`. But the session start API uses upsert on `userId+promptId` — it will redirect to or return the existing session, ignoring the generated ID. The URL in the browser ends up mismatched with the actual session ID.

**Why it happens:** The client generates a random ID before the server has resolved the upsert.

**How to avoid:** On the dashboard, `handlePromptClick` should POST to `/api/session/start` and navigate to the returned `sessionId`, not a client-generated one. The existing `page.tsx` has this bug too but it's pre-existing; for the dashboard reuse the correct pattern.

[ASSUMED] — This is a pre-existing pattern analysis. Verify by reading `/api/session/start` implementation to confirm it returns `{ sessionId }`.

---

## Code Examples

### Relative Date Formatting (ONBOARD-02 session cards)

```typescript
// Source: MDN Intl.RelativeTimeFormat (no external library needed)
function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (days === 0) return "today";
  if (days < 7) return rtf.format(-days, "day");
  if (days < 30) return rtf.format(-Math.floor(days / 7), "week");
  return rtf.format(-Math.floor(days / 30), "month");
}
```

### Stats Computation (ONBOARD-03)

```typescript
// Derived from the /api/history response — no extra fetch needed
function computeStats(sessions: HistorySession[]) {
  const scored = sessions
    .map(s => getScore(s.scoreResult))
    .filter((n): n is number => n !== null);

  return {
    total: sessions.length,
    avg: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
    best: scored.length ? Math.max(...scored) : null,
  };
}
```

### Mobile Canvas Notice (ONBOARD-06, D-09)

```typescript
// Per UI-SPEC: show banner when viewport < 768px
// Use CSS-only approach — no JS media query needed for a static notice
<div className="md:hidden bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mx-4 mt-4 flex items-center gap-3">
  <Monitor className="h-5 w-5 text-amber-300 shrink-0" />
  <p className="text-sm text-amber-200">
    This experience works best on desktop. Switch to a larger screen for the full canvas.
  </p>
</div>
```

[VERIFIED: codebase] — `lucide-react` is installed (1.7.0). `Monitor` icon exists in the package.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate `/history` page for session list | Consolidated into `/dashboard` | Phase 2 | Users no longer need to navigate to a separate page; history and new-session picker on one page |
| Marketing page shows prompts to all users | Post-login redirect to dedicated dashboard | Phase 2 | Cleaner separation of marketing vs. app experience |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Client-side `useEffect` redirect is sufficient for D-01 (no middleware file needed) | Architecture Patterns | If middleware is preferred, need to create `src/middleware.ts` with NextAuth v5 `auth()` integration |
| A2 | `handlePromptClick` on dashboard should POST to `/api/session/start` for the correct session ID | Common Pitfalls | If pre-existing `nanoid` approach works (server ignores the ID), no change needed |

---

## Open Questions

1. **Should `/api/history` pro-gate be removed, or should dashboard use a new endpoint?**
   - What we know: Current gate returns 403 for FREE users. Dashboard should show all users their sessions.
   - What's unclear: Whether the pro-gate was intentional product design (view history = pro feature) or an oversight.
   - Recommendation: Per D-02, dashboard includes past sessions for all tiers. Remove the pro-gate in `/api/history`. If history-as-pro-feature is desired for a dedicated `/history` page later, re-add it there.

2. **Is INTERVIEW-05 (duplicate toolbar) already resolved?**
   - What we know: `InterviewCanvas.tsx` sets `Toolbar: null` in overrides.
   - What's unclear: Whether any tldraw v4 `UndoRedoGroup` renders outside the `Toolbar` slot.
   - Recommendation: Plan a verification step first; skip code change if canvas already shows only one set of controls.

---

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies — all packages already installed, no new APIs or CLIs required).

---

## Validation Architecture

No test framework is installed in this project (`nyquist_validation` — checking config).

Based on `package.json` showing no Jest or Vitest, and no `test/` directories found, testing is manual in this phase. The planner should include browser verification steps for each requirement.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBOARD-01 | Authenticated user at `/` redirects to `/dashboard` | manual | — | — |
| ONBOARD-02 | Dashboard shows session list with scores | manual | — | — |
| ONBOARD-03 | Stats bar shows correct total, avg, best | manual | — | — |
| ONBOARD-04 | "Continue" button on session card navigates to correct session | manual | — | — |
| ONBOARD-06 | Dashboard and marketing page render correctly at 375px | manual (browser DevTools) | — | — |
| INTERVIEW-05 | Only one set of undo/redo/delete controls visible on canvas | manual | — | — |

---

## Project Constraints (from CLAUDE.md)

- `"use client"` only when component uses hooks or browser APIs
- No `any` without justifying comment; no `!` without justifying comment
- All shared types in `src/types/index.ts` — move `HistorySession` interface there
- Never instantiate `new PrismaClient()` outside `src/lib/prisma.ts`
- Business logic in `src/lib/` or Zustand store, not in JSX
- `console.warn` for recoverable issues, `console.error` for real failures — no `console.log`
- Every API route: `const session = await auth()` as first line
- Return `{ error: "unauthorized" }` with 401; `{ error: "forbidden" }` with 403
- Dark theme: `bg-gray-950` base, `border-gray-800`, semantic color classes
- All `fetch()` calls check `res.ok` before reading body
- `difficultyBadge()` helper is duplicated in `page.tsx` and `history/page.tsx` — must be extracted to `src/lib/utils.ts` (not re-duplicated a third time)

---

## Sources

### Primary (HIGH confidence)
- Codebase: `src/app/history/page.tsx` — existing data fetch pattern, session card markup, auth redirect
- Codebase: `src/app/page.tsx` — `PromptCard`, `difficultyBadge`, auth state usage
- Codebase: `src/components/canvas/InterviewCanvas.tsx` — tldraw component override map
- Codebase: `src/app/api/history/route.ts` — existing pro-gate, Prisma query
- Codebase: `prisma/schema.prisma` — `InterviewSession` fields
- `.planning/phases/02-dashboard-session-management/02-CONTEXT.md` — all locked decisions
- `.planning/phases/02-dashboard-session-management/02-UI-SPEC.md` — component specs, copy

### Secondary (MEDIUM confidence)
- [ASSUMED] NextAuth v5 middleware pattern for redirect — standard pattern, not verified in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; no new packages needed
- Architecture: HIGH — all integration points traced through actual codebase files
- Pitfalls: HIGH — pro-gate and scoreResult JSON shape issues verified directly in source code
- tldraw toolbar: HIGH — `TLDRAW_COMPONENT_OVERRIDES` read directly from `InterviewCanvas.tsx`

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable libraries, internal codebase)
