# SysDraw — Agent Guidelines

## Who reads this file

Any AI coding agent (Claude Code, Codex, Copilot Workspace etc.)
working autonomously on this codebase. Read this before making any
changes. Read CLAUDE.md first for project architecture context.

---

## Behaviour principles

### 1. Read before writing
Before modifying any file, read it fully. Do not assume the current
implementation matches what was planned in specs or comments. The
actual code is the ground truth.

### 2. One problem per task
If given a vague task like "fix the auth", break it into discrete
sub-tasks, complete each one, verify it, then move to the next.
Never batch unrelated changes into a single edit.

### 3. Verify after every change
After modifying a file:
- Run `npx tsc --noEmit` to check TypeScript errors.
- If you changed an API route, trace the full request/response cycle
  in your reasoning before declaring it done.
- If you changed a Prisma schema, run `npx prisma validate`.

### 4. Never hallucinate file contents
If you need to see a file, read it. Do not assume its contents from
filename or context. The actual implementation may differ from any
spec or plan discussed elsewhere.

### 5. Migrations require explicit approval
Never run `npx prisma migrate dev` or `npx prisma migrate reset`
autonomously. Flag that a migration is needed, show the schema diff,
and wait for confirmation before running it.

---

## Allowed autonomous actions

These are safe to do without asking:

- Reading any file in the repository
- Running `npx tsc --noEmit`
- Running `npx prisma validate`
- Running `npx prisma generate` (after schema changes)
- Running `npm run build` (check for build errors)
- Running `npx prisma studio` to inspect DB state
- Editing TypeScript, TSX, CSS files
- Adding or removing npm packages (flag what and why first)
- Creating new files in established directories
- Writing or updating tests

---

## Actions requiring confirmation before proceeding

Always stop and ask before:

- Running any `prisma migrate` command
- Deleting files
- Changing the Prisma schema (show the diff first)
- Changing `src/types/index.ts` (downstream effects are wide)
- Changing `src/lib/graph-parser.ts` output shape
- Changing `src/lib/limits.ts` values
- Modifying environment variable names
- Adding new npm packages with significant bundle size
- Any change that affects the LemonSqueezy webhook handler
- Any change to the NextAuth configuration

---

## Priority order when fixing issues

When running an audit or fix pass, address issues in this order:

1. **Type errors** — `npx tsc --noEmit` must pass clean before anything else
2. **Security issues** — auth checks, ownership checks, limit enforcement
3. **Data integrity** — anything that could corrupt DB state
4. **Broken functionality** — features that don't work at all
5. **Partial implementations** — features that work but incompletely
6. **Code quality** — naming, structure, dead code
7. **Performance** — only after correctness is confirmed

---

## Patterns to enforce

### Auth check pattern (every API route)
```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 })
}
```

### Ownership check pattern (every session route)
```typescript
const existing = await prisma.interviewSession.findUnique({
  where: { id: params.id },
  select: { userId: true },
})
if (!existing) return NextResponse.json({ error: "session_not_found" }, { status: 404 })
if (existing.userId !== session.user.id) {
  return NextResponse.json({ error: "forbidden" }, { status: 403 })
}
```

### Limit check pattern (hint + score routes)
```typescript
// Always read from DB — never trust client body
const record = await prisma.interviewSession.findUnique({
  where: { id: sessionId },
  select: { hintsUsed: true, userId: true, promptId: true },
})
if (record.hintsUsed >= limit) {
  return NextResponse.json({ error: "free_limit_reached" }, { status: 403 })
}
// Increment atomically AFTER successful AI call (hints) or BEFORE streaming (scores)
await prisma.interviewSession.update({
  where: { id: sessionId },
  data: { hintsUsed: { increment: 1 } },
})
```

### Score JSON sanitization pattern
```typescript
const sanitizeJson = (raw: string): string =>
  raw.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

const sanitized = sanitizeJson(fullText)
if (!sanitized.endsWith("}")) {
  // truncation error — do not attempt parse
}
const parsed = JSON.parse(sanitized)
if (typeof parsed.score !== "number") throw new Error("Invalid score shape")
```

---

## Patterns to reject

If you find these patterns anywhere in the codebase, flag and fix them:

```typescript
// WRONG — trusting client for limit enforcement
const { hintsUsed } = await req.json()
if (hintsUsed >= limit) { ... }

// WRONG — sending raw tldraw records to AI
body: JSON.stringify({ records: editor.store.allRecords() })

// WRONG — multiple Prisma instances
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()  // should import from @/lib/prisma

// WRONG — any type without comment
const data: any = response  // no explanation

// WRONG — localStorage for session state
localStorage.setItem("session", JSON.stringify(state))

// WRONG — console.log in committed code
console.log("debug:", data)
```

---

## Zustand store rules

The session store in `src/store/session.ts` is the single source of
truth for client-side session state. Rules:

- `hintsUsed` and `scoresUsed` in the store are display caches.
  They are ALWAYS synced from server responses, never incremented locally.
- `syncFromServer(data)` is the only way to hydrate the store from DB.
- `syncHintsFromServer(n)` and `syncScoresFromServer(n)` are the only
  way to update usage counts.
- `sessionId` in the store must be set before any AI API call can proceed.
- Never add derived state to the store — compute it from existing fields.

---

## tldraw rules

- Custom shapes live in `src/components/canvas/shapes/`.
  Each shape must implement `canBind()` returning true.
  Each shape must implement `canEdit()` returning true.
  Each shape must render a validation badge when `meta.isLabeled === false`.
- Never import from `@tldraw/editor` directly — use `@tldraw/tldraw`.
- The default tldraw toolbar, StylePanel, and MainMenu must remain hidden.
- `VendorToolbar` is the only toolbar. Do not add a second toolbar component.
- All canvas reads go through `parseCanvasToGraph()` — never read
  `editor.store.allRecords()` directly outside of the canvas watcher.

---

## Testing an end-to-end flow

When verifying auth + session + AI changes work together, trace this flow:

1. User visits `/` — not logged in
2. User clicks a prompt card → redirected to `/login`
3. User signs in with Google → redirected back to `/`
4. User clicks same prompt → navigated to `/session/[nanoid]`
5. Session page calls `POST /api/session/start` with `{ promptId }`
6. Start route upserts InterviewSession, returns sessionId + hintsUsed
7. Zustand `syncFromServer()` called with DB response
8. User draws a vendor shape, labels it
9. Canvas watcher debounces 1.5s, diffs graph, updates `latestGraphRef`
10. Canvas autosave calls `PATCH /api/session/[id]/canvas`
11. User clicks "Ask for a hint"
12. Validation passes (labeled component exists)
13. `POST /api/ai/hint` with `{ sessionId, graph, history }`
14. Hint route reads hintsUsed from DB, checks limit, calls AI
15. AI returns hint text, DB increments hintsUsed
16. Response contains `{ hint, hintsUsed }` — Zustand syncs
17. User clicks "Run Review"
18. `POST /api/ai/score` with `{ sessionId, graph, history }`
19. Score route reads scoresUsed, increments BEFORE streaming
20. Streamed JSON arrives, sanitized, parsed, set in store + DB
21. User refreshes — session page calls start again, gets same sessionId,
    same hintsUsed, same canvasState, same chatHistory from DB

If any step breaks, the issue is in that step's component or route.