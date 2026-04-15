# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Layered client-server with semantic graph abstraction

SysDraw follows a three-tier architecture where the tldraw canvas (raw geometric JSON) is never sent directly to AI. Instead, `src/lib/graph-parser.ts` converts canvas state into a `SemanticGraph` (nodes with vendor/category/label, edges with labels, text annotations). This abstraction is the architectural centerpiece — all AI operations, persistence, and state management depend on it.

**Key Characteristics:**
- **Canvas layer** (tldraw) → raw geometric records, custom shapes with vendor metadata
- **Semantic abstraction** (graph-parser) → vendor nodes, labeled edges, annotations
- **Dual AI models** — Haiku/Flash for hints (fast, cheap), Sonnet/Pro for scoring (thorough)
- **DB-driven limits** — hints/scores tracked in Postgres, never in client state alone
- **Zustand for session state** — all UI state centralized, prevents prop drilling
- **IndexedDB fallback** — canvas and session data persisted locally when server unavailable

## Layers

**Presentation Layer:**
- Purpose: Next.js App Router pages + React components
- Location: `src/app/` and `src/components/`
- Contains: Page components, UI components, form inputs, canvas wrapper
- Depends on: Zustand store, auth, API routes
- Used by: Browser

**Canvas Layer:**
- Purpose: tldraw editor with custom vendor shapes (PostgreSQL, Redis, Kafka, etc.)
- Location: `src/components/canvas/`
- Contains: `InterviewCanvas`, custom shape definitions (`*Shape.tsx`), toolbar, validation hooks
- Depends on: tldraw v2, `SemanticGraph` types, graph-parser for diff
- Used by: Session page, exports semantic graph to chat/AI

**Semantic Graph Layer:**
- Purpose: Convert tldraw records → graph structure for AI consumption
- Location: `src/lib/graph-parser.ts`
- Contains: Type guards, text extraction, annotation association, graph validation
- Depends on: tldraw record types, SemanticGraph interface
- Used by: All AI routes, session page for state sync

**AI Orchestration Layer:**
- Purpose: Prompt building, model routing, streaming response handling
- Location: `src/lib/ai.ts`
- Contains: `generateAnthropicHint`, `generateGeminiHint`, `buildScoringPrompt`, `createScoringStream`
- Depends on: Anthropic SDK, Google Gemini SDK, graph formatting utilities
- Used by: `/api/ai/hint` and `/api/ai/score` routes

**Session Management Layer:**
- Purpose: Client-side session state and chat/hint history
- Location: `src/store/session.ts`
- Contains: Zustand store with session metadata, canvas state, hints, messages, scores, timer
- Depends on: Zustand, types
- Used by: All components and pages

**Persistence Layer:**
- Purpose: Store canvas, chat, scores, and user data
- Location: `src/lib/prisma.ts`, `src/lib/indexeddb.ts`
- Contains: Prisma singleton (DB), IndexedDB wrapper (local fallback)
- Depends on: Prisma Client (PostgreSQL), browser IndexedDB API
- Used by: API routes (DB), session page (IndexedDB)

**API Layer:**
- Purpose: HTTP endpoints for session control, AI operations, billing
- Location: `src/app/api/`
- Contains: Auth checks, limit enforcement, ownership validation, AI calls, data persistence
- Depends on: NextAuth, Prisma, AI layer, limits
- Used by: Client components via fetch

**Auth Layer:**
- Purpose: OAuth providers (Google, GitHub) + session management
- Location: `src/auth.ts`
- Contains: NextAuth v5 config, Google + GitHub providers, Prisma adapter
- Depends on: NextAuth v5, Prisma
- Used by: All API routes, session pages

**Limits Layer:**
- Purpose: Tier-aware rate limiting (session-level and daily)
- Location: `src/lib/limits.ts`, `src/lib/daily-limits.ts`
- Contains: `LIMITS` constant (free/pro/premium), daily reset logic
- Depends on: Prisma (for daily counter reset), enum `Tier`
- Used by: Hint and score routes

## Data Flow

**Canvas Drawing → AI Hint:**

1. User draws on tldraw canvas (shapes, arrows, labels)
2. `InterviewCanvas` listens to store changes, parses via `parseCanvasToGraph()`
3. `hasGraphChanged()` diff check prevents API spam on pixel movements
4. User clicks "Ask Hint" button
5. `ChatPanel.askHint()` fetches `/api/ai/hint` with `SemanticGraph`
6. Route checks auth → ownership → session tier limits → daily limits
7. `generateAnthropicHint()` or `generateGeminiHint()` builds prompt from graph
8. Response stored in `InterviewSession.hintsUsed` (DB), synced to Zustand
9. Hint displayed in chat, stored in `useSessionStore.hints`

**Canvas Drawing → Score:**

1. User clicks "Score" button
2. `SessionPage.handleScoreClick()` fetches `/api/ai/score` with latest `SemanticGraph`
3. Route checks auth → ownership → limits as above, increments `scoresUsed` BEFORE streaming
4. `buildScoringPrompt()` combines graph + chat history + scoring criteria
5. `createScoringStream()` returns `ReadableStream` from Anthropic or Gemini
6. Client reads stream chunks, sanitizes JSON (strip markdown backticks), parses
7. `ScoreResult` with score/breakdown/feedback displayed in `ScorePanel`
8. Stored in `InterviewSession.scoreResult` in Postgres

**Canvas Autosave:**

1. `InterviewCanvas` emits snapshot via `onSnapshotChange` callback
2. `SessionPage.scheduleCanvasSave()` debounces (3000ms) to prevent thrashing
3. Attempts PATCH `/api/session/[id]/canvas` to save to DB
4. On failure, falls back to IndexedDB via `saveSessionLocally()`
5. On success, updates `lastSentGraph` in Zustand to track what server has

**Session Initialization:**

1. User navigates to `/session/[id]`
2. Component checks auth status → redirects to login if needed
3. Calls POST `/api/session/start` with promptId
4. Route upserts `InterviewSession` (one per user per question, @@unique constraint)
5. Returns session metadata (hints/scoresUsed, canvas state, chat history)
6. Client hydrates Zustand via `syncFromServer()`
7. Also loads local IndexedDB snapshot and merges (local has priority if server fails)

**State Management:**

- **Server-authoritative:** `hintsUsed`, `scoresUsed`, `canvasState`, `chatHistory`, `scoreResult` (stored in `InterviewSession`)
- **Client-cached:** Zustand holds copies, synced FROM server responses after API calls
- **Local-only fallback:** IndexedDB mirrors session data; used if server unreachable
- **Derived state:** `unreadHintCount`, `isScoring`, `isAiThinking` calculated in Zustand

## Key Abstractions

**SemanticGraph:**
- Purpose: Represent architecture as vendor nodes, labeled edges, text annotations
- Examples: `src/types/index.ts` (interface definition), `src/lib/graph-parser.ts` (construction)
- Pattern: Output of `parseCanvasToGraph()`, never modified, passed to all AI endpoints
- Critical: Shape must match across graph-parser, ai.ts, and all API routes

**ShapeMeta:**
- Purpose: Metadata attached to tldraw shapes (vendor, category, label, isLabeled)
- Examples: `src/components/canvas/shapes/*Shape.tsx` (define shapes with meta)
- Pattern: Type guard `hasShapeMeta()`, used to filter vendor vs. generic nodes

**DesignPrompt:**
- Purpose: 15 system design questions with scoring rubric
- Examples: `src/lib/prompts.ts` (constant array, indexed by tier)
- Pattern: `PROMPTS[index]` contains id, title, description, hints about scalability/reliability/etc.
- Usage: Passed to AI prompt builders, indexed by `promptId` in routes

**InterviewSession (DB model):**
- Purpose: Persist session state per user per question
- Location: `prisma/schema.prisma`
- Fields: `userId`, `promptId` (unique pair), `canvasState`, `chatHistory`, `scoreResult`, `hintsUsed`, `scoresUsed`, `status`
- Constraint: `@@unique([userId, promptId])` ensures one session per question per user
- Refreshing browser hits this session, limits NOT reset

**ChatMessage:**
- Purpose: User or AI message in the interview chat
- Examples: `src/types/index.ts`
- Pattern: `id`, `role` ("ai" or "user"), `content`, `timestamp`, optional `model`
- Used: In `useSessionStore.messages`, sent as history to AI endpoints

**Hint:**
- Purpose: Background hint triggered by graph change
- Examples: `src/types/index.ts`
- Pattern: `id`, `content`, `triggeredAt` (canvas version), `isRead`
- Used: In `useSessionStore.hints`, displayed in `HintBubble`, separate from chat

## Entry Points

**Web (Browser):**
- Location: `src/app/layout.tsx`
- Triggers: User visits `/`
- Responsibilities: Root layout, session provider, auth context

**Home Page:**
- Location: `src/app/page.tsx`
- Triggers: User at `/` or unauthenticated
- Responsibilities: Show prompt selector, login button, pricing info

**Session Page:**
- Location: `src/app/session/[id]/page.tsx`
- Triggers: POST `/api/session/start` → redirect to `/session/[sessionId]`
- Responsibilities: Initialize session state, render canvas + chat + notes, handle autosave, scoring

**API: Session Start:**
- Location: `src/app/api/session/start/route.ts`
- Triggers: Client POST with `promptId`
- Responsibilities: Auth check → upsert `InterviewSession` → return session metadata

**API: AI Hint:**
- Location: `src/app/api/ai/hint/route.ts`
- Triggers: Client POST with `sessionId`, `graph`, `history`, `llmProvider`
- Responsibilities: Auth → ownership → tier limit → daily limit → generate hint → increment DB counter

**API: AI Score:**
- Location: `src/app/api/ai/score/route.ts`
- Triggers: Client POST with `sessionId`, `graph`, `history`, `llmProvider`
- Responsibilities: Same auth/limit checks → build prompt → stream JSON → client parses

**API: Canvas Patch:**
- Location: `src/app/api/session/[id]/canvas/route.ts`
- Triggers: Session page autosave timer (debounced 3s)
- Responsibilities: Auth → ownership → update `InterviewSession.canvasState` with snapshot

## Error Handling

**Strategy:** Fail open with fallback to IndexedDB; show user-facing messages for quota/limit errors

**Patterns:**

- **Unauthorized (401):** API returns `{ error: "unauthorized" }` → client redirects to login
- **Forbidden (403):** Ownership check failed → return `{ error: "forbidden" }`
- **Free limit (403):** Session limit reached → return `{ error: "free_limit_reached", hintsUsed/scoresUsed }` → client shows upgrade prompt
- **Daily limit (403):** Return `{ error: "daily_limit_reached", message: "..." }` → client shows specific message
- **Quota (429):** AI provider rate limit → caught in score route → return 429 → client shows "quota exceeded, try again"
- **Truncated JSON (score route):** Response doesn't end with `}` → parse fails → client shows "Invalid response from AI"
- **Server save fails (canvas):** DB PATCH fails → IndexedDB fallback invoked → console.warn, no user error

**Types:**
- `ScoreResult` has optional `error` and `isQuotaError` flags
- `Hint` is opaque string; errors shown as special hint messages
- Chat errors shown as system messages

## Cross-Cutting Concerns

**Logging:**
- Use `console.warn()` for recoverable issues (IndexedDB failure, server save fallback)
- Use `console.error()` for real failures (auth errors, parse failures)
- Never use `console.log()` in committed code
- Log AI errors before returning to client

**Validation:**
- Graph validity checked in `graph-parser.ts` (unlabeled edges/shapes)
- Canvas validation in `src/components/canvas/validation/useShapeValidator.ts`
- All API inputs type-checked server-side before use
- Streaming JSON sanitized before parsing (strip markdown, check end character)

**Authentication:**
- Every API route starts with `const session = await auth()`
- Check `session?.user?.id` exists and is string
- All routes check ownership (`userId === session.user.id`)
- Tier read fresh from DB on each limit check (token may be stale)

**Rate Limiting:**
- Session-level: `hintsUsed >= LIMITS.free.aiHintsPerSession` (read from DB)
- Daily-level: `checkAndIncrementDailyHints()` — atomic operation on `User.dailyHintsUsed`
- Pro/Premium: infinite limits in code (`Infinity`)
- Client side checks only warn; server side enforces

**Security:**
- No raw tldraw JSON sent to AI (only `SemanticGraph`)
- No client-controlled hintsUsed/scoresUsed in request body
- No localStorage (use IndexedDB)
- Secrets in env vars only (ANTHROPIC_API_KEY, etc.) — never in response

---

*Architecture analysis: 2026-04-15*
