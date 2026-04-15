# SysDraw — Claude Code Context

## What this project is

SysDraw is a system design interview practice SaaS. Users pick a
question, draw their architecture on a whiteboard using vendor-specific
components (PostgreSQL, Redis, Kafka etc.), and an AI interviewer watches
the canvas in real-time and asks follow-up questions. At the end, the
design is scored out of 100 with a breakdown across scalability,
reliability, tradeoffs, and completeness.

## Stack

- Next.js 14 App Router + TypeScript (strict)
- tldraw v2 — canvas with custom vendor shapes
- Zustand — all session state
- NextAuth v5 (beta) + PrismaAdapter — Google + GitHub OAuth
- Prisma + PostgreSQL (Supabase) — persistence
- Anthropic Claude API + Google Gemini API — AI hints and scoring
- LemonSqueezy — payments and subscriptions
- Tailwind CSS — dark theme throughout (bg-gray-950 base)

## Critical architecture decisions — read before touching anything

### The SemanticGraph pattern
tldraw stores state as raw geometric JSON. We NEVER send this to AI.
`src/lib/graph-parser.ts` converts tldraw records into a `SemanticGraph`
(nodes with vendor/category/label + labeled edges + text annotations).
This is what gets sent to every AI API call. Do not bypass this.

### Two AI models, two purposes
- Hints → `claude-haiku-4-5-20251001` or `gemini-1.5-flash` (fast, cheap, 150 tokens max)
- Scoring → `claude-sonnet-4-6` or `gemini-1.5-pro` (thorough, 1500 tokens max)
Never swap models between purposes. Never use a stronger model for hints.

### DB is source of truth for limits — never the client
`hintsUsed` and `scoresUsed` live in `InterviewSession` in Postgres.
API routes read limits from DB, increment atomically, return the new
count. Zustand holds a local copy synced FROM the server response.
The client never sends `hintsUsed` or `scoresUsed` in request bodies.

### One session per user per question
`InterviewSession` has `@@unique([userId, promptId])`. The session start
route upserts on this constraint. Refreshing the browser CANNOT reset
limits — the DB always wins.

### Client-side diff before emitting
`hasGraphChanged()` in `graph-parser.ts` compares the previous and new
SemanticGraph before emitting to the server. Do not remove this check.
tldraw fires hundreds of store events per second — without the diff,
the API is hammered on every pixel movement.

## File ownership — what lives where

```
src/lib/ai.ts             — prompt builders + model routing + createScoringStream
src/lib/graph-parser.ts   — tldraw records → SemanticGraph (never modify the output shape)
src/lib/prompts.ts        — 15 preset prompts with scoring criteria
src/lib/limits.ts         — tier limit constants (single source of truth)
src/lib/prisma.ts         — Prisma singleton (never instantiate PrismaClient anywhere else)
src/lib/lemonsqueezy.ts   — LemonSqueezy client init
src/store/session.ts      — Zustand session store (all session state here, nowhere else)
src/types/index.ts        — all shared types (SemanticGraph, ScoreResult, ChatMessage etc.)
src/auth.ts               — NextAuth v5 config
src/middleware.ts         — route protection for /session/* and /api/*
```

## Conventions

### TypeScript
- Strict mode. No `any` without a comment explaining why.
- `interface` for object shapes, `type` for unions.
- All shared types in `src/types/index.ts` — never define inline in components.
- No non-null assertions (`!`) without a justifying comment.
- No enums — use string union types or `as const` objects.

### API routes
- Every route checks auth via `const session = await auth()` first line.
- Every route checks ownership before reading/writing a session.
- Return `{ error: "unauthorized" }` with 401 for auth failures.
- Return `{ error: "forbidden" }` with 403 for ownership failures.
- Return `{ error: "free_limit_reached" }` with 403 for limit failures.
- Never trust values from the request body for limit enforcement.

### Components
- `"use client"` only when the component uses hooks or browser APIs.
- Business logic belongs in `src/lib/` or Zustand store, not in JSX.
- No prop drilling — use Zustand for cross-component session state.
- Tailwind only. No inline styles except for tldraw-specific overrides.

### Streaming responses
- Hint route: plain JSON response (hints are short, no streaming needed).
- Score route: `ReadableStream` — await `model.generateContentStream()`
  BEFORE constructing the ReadableStream so quota errors are catchable.
- Always sanitize AI JSON responses before parsing:
  strip ```json fences, check `endsWith("}")` before `JSON.parse`.

### Error handling
- All `fetch()` calls check `res.ok` before reading body.
- Free limit 403 → show upgrade nudge, not generic error.
- Quota 429 → show specific "quota exceeded, try again" message.
- Truncated score JSON (doesn't end with `}`) → specific truncation message.
- IndexedDB failures are non-fatal — log warn, never throw.

## What NOT to do

- Do NOT send raw tldraw store records to any AI endpoint.
- Do NOT read `hintsUsed` or `scoresUsed` from the request body in API routes.
- Do NOT instantiate `new PrismaClient()` outside `src/lib/prisma.ts`.
- Do NOT use `localStorage` — use IndexedDB via `src/lib/indexeddb.ts`.
- Do NOT re-enable tldraw's default toolbar, StylePanel, or MainMenu.
- Do NOT add auth or billing logic to Week 1-2 canvas/AI components.
- Do NOT change the SemanticGraph type shape without updating graph-parser,
  ai.ts, and all API routes that consume it.
- Do NOT use `console.log` in committed code.
  Use `console.warn` for recoverable issues, `console.error` for real failures.

## Environment variables

Server-only (no NEXT_PUBLIC_ prefix):
- DATABASE_URL
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
- ANTHROPIC_API_KEY
- LEMONSQUEEZY_API_KEY / LEMONSQUEEZY_STORE_ID / LEMONSQUEEZY_WEBHOOK_SECRET

Public (safe for client):
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID
- NEXT_PUBLIC_LEMONSQUEEZY_PREMIUM_VARIANT_ID

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in all values
npx prisma migrate dev
npm run dev
```

TypeScript check: `npx tsc --noEmit`
DB inspect: `npx prisma studio`

<!-- GSD:project-start source:PROJECT.md -->
## Project

**SysDraw — Production Push**

SysDraw is a system design interview practice SaaS where users pick a question, draw their architecture using vendor-specific components on an interactive canvas, and an AI interviewer provides hints and scoring in real-time. We're pushing toward production by fixing stability/performance issues, enriching the interview experience (better components, voice explanations, analytics), and refining the UI to feel polished and responsive.

**Core Value:** Users can practice system design with **immediate, interactive AI feedback** — not a static checker, but a real interviewer asking follow-ups and scoring their work.

### Constraints

- **Timeline**: Launch in few weeks
- **AI costs**: Avoid expensive API plans until paying users justify investment — must optimize token usage on free tier
- **Data scope**: Simple data, no strict integrity requirements
- **Launch readiness**: 10 users without major incidents = production ready
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - Strict mode (tsconfig.json: `strict: true`)
- JavaScript (React JSX)
- SQL (PostgreSQL dialect via Prisma)
## Runtime
- Node.js (no specific version pinned; infer from `.nvmrc` if present)
- npm (no lock file versioning detected in package.json)
- Lockfile: `package-lock.json` (implicit)
## Frameworks
- Next.js 16.2.1 - Full-stack React framework with App Router
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering
- next-auth 5.0.0-beta.30 - OpenID Connect providers (Google, GitHub OAuth)
- @auth/prisma-adapter 2.11.1 - PrismaAdapter for NextAuth session/account storage
- Zustand 5.0.12 - Client-side session state (canvas, hints, scores, chat)
- @tldraw/editor 4.5.3 - Canvas library core
- @tldraw/tldraw 4.5.3 - Pre-built UI and vendor shapes
- socket.io 4.8.3 - WebSocket server
- socket.io-client 4.8.3 - WebSocket client
- No test framework detected in dependencies (Jest or Vitest not installed)
- TypeScript 5.9.3 - Type checking and compilation
- ESLint 9 - Linting
- eslint-config-next 16.2.1 - Next.js ESLint rules
## Key Dependencies
- @anthropic-ai/sdk 0.80.0 - Claude API for hints, chat, scoring
- @google/generative-ai 0.24.1 - Google Gemini API (secondary AI model)
- @prisma/client 7.6.0 - Database ORM
- @prisma/adapter-pg 7.6.0 - PostgreSQL adapter for Prisma
- @prisma/extension-accelerate 3.0.1 - Query caching/acceleration (Supabase)
- @lemonsqueezy/lemonsqueezy.js 4.0.0 - Payment/subscription SDK
- pg 8.20.0 - PostgreSQL client (low-level)
- prisma 7.6.0 - Database toolkit and CLI
- Tailwind CSS 4.2.2 - Utility-first CSS framework
- @tailwindcss/postcss 4.2.2 - PostCSS plugin for Tailwind
- lucide-react 1.7.0 - Icon library
- nanoid 5.1.7 - URL-friendly unique IDs
- ai 6.0.138 - Vercel AI SDK (streaming helpers, potential)
- dotenv 17.4.1 - Environment variable loader
## Configuration
- .env.local (local development)
- .env.example (template)
- Environment variables configured as per CLAUDE.md: ANTHROPIC_API_KEY, DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET, LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_WEBHOOK_SECRET, NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID, NEXT_PUBLIC_LEMONSQUEEZY_PREMIUM_VARIANT_ID
- `next.config.ts` - Minimal Next.js configuration (no special overrides)
- `tsconfig.json` - TypeScript strict mode with ES2017 target, bundler module resolution
- `postcss.config.mjs` - PostCSS with Tailwind CSS plugin
- `eslint.config.mjs` - ESLint configuration (ESLint 9+)
## Platform Requirements
- Node.js (LTS recommended)
- npm CLI
- PostgreSQL connection (Supabase or local)
- Environment variables: ANTHROPIC_API_KEY, GOOGLE_GEMINI_API_KEY, DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
- Node.js 18+ (Next.js 16 requirement)
- PostgreSQL database (Supabase)
- Anthropic API key and quota
- Google Gemini API key (optional fallback)
- LemonSqueezy account and credentials
- NextAuth secret for session encryption
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- API routes follow Next.js convention: `src/app/api/[path]/route.ts`
- Components use PascalCase: `DatabaseShape.tsx`, `ChatPanel.tsx`, `PromptSelector.tsx`
- Utility/hook files use camelCase: `useCanvasValidation.ts`, `useSessionStore.ts`
- Library modules use camelCase: `graph-parser.ts`, `indexeddb.ts`, `daily-limits.ts`
- Camel case for all functions: `formatGraphForPrompt()`, `truncateGraphForAI()`, `distanceBetween()`
- Utility functions with leading underscore for private/internal: `_geminiClient` (module-level)
- Hook pattern: `use[Feature]` e.g. `useCanvasValidation()`, `useSessionStore()`
- Factory functions: `getDB()`, `getGeminiClient()`, `getShapeCenter()`
- Camel case for all variables and constants
- Module-level constants in UPPER_SNAKE_CASE for finite sets: `LIMITS`, `PROMPTS`, `LIMITS_AI`
- Type predicates use `is` prefix: `hasShapeMeta()`, `isVendorShape()`, `isGenericShape()`, `isTextShape()`
- Interfaces for object shapes: `ShapeMeta`, `SemanticGraph`, `ChatMessage`, `DesignPrompt`
- Type unions with string literals (no enums): `type AIModel = "haiku" | "flash" | "sonnet"`
- Discriminated unions: `role: "ai" | "user"`, `difficulty: "easy" | "medium" | "hard"`
- Generic type parameters in uppercase: `<SessionState>`, `<Geometry2d>`
## Code Style
- No Prettier config found — using ESLint config-next defaults
- 2-space indentation (consistent in examples)
- Line breaks after `{` and before `}`
- Trailing commas in multi-line arrays/objects
- ESLint with `eslint-config-next` (core-web-vitals + TypeScript configs)
- Config: `eslint.config.mjs`
- Run: `npm run lint`
- No console.log in committed code — use `console.warn()` or `console.error()` only
## Import Organization
- `@/*` → `./src/*` (defined in tsconfig.json)
- Used throughout: `import { prisma } from "@/lib/prisma"`
## Error Handling
- First line: `const session = await auth()` — always check auth
- Return standardized JSON error responses:
- Ownership check before DB operations: `if (record.userId !== session.user.id) return 403`
- DB limits are source of truth — never trust client
- AI call errors logged with `console.error("[context]", err)` using bracket prefix for filtering
- Database errors logged as context e.g. `console.error("[webhook] DB update failed:", error)`
- Catch JSON parse errors explicitly: `JSON.parse(...).catch(() => ({}))`
- IndexedDB failures are non-fatal: `catch (error) { console.warn("IndexedDB...", error); return false }`
- Specific error codes for UI handling: `"free_limit_reached"`, `"daily_limit_reached"`, `"quota_exceeded"`
- User-facing: descriptive strings e.g. `"Daily hint limit reached. Resets in 24 hours."`
- Validation messages include counts: `"Label all components before asking for a hint (2 unlabeled shapes)"`
## Logging
- `console.error("[scope] message", error)` — failures and exceptions
- `console.warn("message", data)` — recoverable issues or non-fatal failures
- No `console.log()` in any committed code
- Bracket prefixes for filtering: `[checkout]`, `[webhook]`, `[export]`, `[billing]`
## Comments
- Justify non-obvious decisions (from CLAUDE.md): "DB is source of truth for limits — never the client"
- Mark temporary workarounds with `// Fallback to plain text prop`
- Explain complex algorithms: `// Rich text extraction` blocks
- TODO/FIXME comments not found in codebase — avoid
- No JSDoc comments found in codebase
- Interfaces document themselves through type names and property comments
- Complex functions documented inline with section headers: `// ─── Shape type guards ────────────────────`
## Function Design
- Most utility functions under 30 lines
- API routes structured in numbered comment blocks (1-8 steps)
- Component functions use smaller extracted sub-components: `LabelEditor()`, `BreakdownBar()`
- Interfaces for object parameters: `{ shape: DatabaseShapeType }`
- Type destructuring in params: `{ params }: { params: Promise<{ id: string }> | { id: string } }`
- Callback parameters with specific types not unions
- API routes return `NextResponse.json()`
- Predicates return boolean: `hasShapeMeta(): shape is ShapeWithMeta`
- Utility functions return typed objects: `{ canRequestHint: boolean, reason: string | null }`
- Async functions return promises: `Promise<IDBDatabase | null>`, `Promise<boolean>`
## Module Design
- Named exports used throughout: `export const LIMITS`, `export function getDB()`
- Re-export from barrel file: `src/components/canvas/shapes/index.ts` exports all shape utilities
- No default exports found
- `src/components/canvas/shapes/index.ts` — aggregates all shape utilities
- Single source of truth for type definitions: `src/types/index.ts`
- Single source of truth for prompts: `src/lib/prompts.ts`
- Single source of truth for limits: `src/lib/limits.ts`
## TypeScript Strict Mode
- Strict mode enabled (tsconfig: `"strict": true`)
- No `any` without justifying comment
- Non-null assertions (`!`) avoided except with justifying comment: `// Guaranteed by X check above`
- Type guards used for runtime validation: `hasShapeMeta(shape): shape is ShapeWithMeta`
- `as const` for immutable tuples and literal types: `LIMITS` and `PROMPTS` use `as const`
## Component-Specific Conventions
- "use client" pragma only when using hooks or browser APIs
- Destructure hooks at component top: `const sessionId = useSessionStore((s) => s.sessionId)`
- Zustand subscription pattern: `(s) => s.property` for dependency tracking
- Business logic in hooks or store, not in JSX
- Tailwind CSS only (no inline styles except tldraw overrides)
- Dark theme base: `bg-gray-950` (mentioned in CLAUDE.md)
- Semantic color classes: `text-emerald-300`, `border-red-500`, `bg-amber-900/30`
- Flex utilities: `flex items-center justify-between`, `gap-3`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- **Canvas layer** (tldraw) → raw geometric records, custom shapes with vendor metadata
- **Semantic abstraction** (graph-parser) → vendor nodes, labeled edges, annotations
- **Dual AI models** — Haiku/Flash for hints (fast, cheap), Sonnet/Pro for scoring (thorough)
- **DB-driven limits** — hints/scores tracked in Postgres, never in client state alone
- **Zustand for session state** — all UI state centralized, prevents prop drilling
- **IndexedDB fallback** — canvas and session data persisted locally when server unavailable
## Layers
- Purpose: Next.js App Router pages + React components
- Location: `src/app/` and `src/components/`
- Contains: Page components, UI components, form inputs, canvas wrapper
- Depends on: Zustand store, auth, API routes
- Used by: Browser
- Purpose: tldraw editor with custom vendor shapes (PostgreSQL, Redis, Kafka, etc.)
- Location: `src/components/canvas/`
- Contains: `InterviewCanvas`, custom shape definitions (`*Shape.tsx`), toolbar, validation hooks
- Depends on: tldraw v2, `SemanticGraph` types, graph-parser for diff
- Used by: Session page, exports semantic graph to chat/AI
- Purpose: Convert tldraw records → graph structure for AI consumption
- Location: `src/lib/graph-parser.ts`
- Contains: Type guards, text extraction, annotation association, graph validation
- Depends on: tldraw record types, SemanticGraph interface
- Used by: All AI routes, session page for state sync
- Purpose: Prompt building, model routing, streaming response handling
- Location: `src/lib/ai.ts`
- Contains: `generateAnthropicHint`, `generateGeminiHint`, `buildScoringPrompt`, `createScoringStream`
- Depends on: Anthropic SDK, Google Gemini SDK, graph formatting utilities
- Used by: `/api/ai/hint` and `/api/ai/score` routes
- Purpose: Client-side session state and chat/hint history
- Location: `src/store/session.ts`
- Contains: Zustand store with session metadata, canvas state, hints, messages, scores, timer
- Depends on: Zustand, types
- Used by: All components and pages
- Purpose: Store canvas, chat, scores, and user data
- Location: `src/lib/prisma.ts`, `src/lib/indexeddb.ts`
- Contains: Prisma singleton (DB), IndexedDB wrapper (local fallback)
- Depends on: Prisma Client (PostgreSQL), browser IndexedDB API
- Used by: API routes (DB), session page (IndexedDB)
- Purpose: HTTP endpoints for session control, AI operations, billing
- Location: `src/app/api/`
- Contains: Auth checks, limit enforcement, ownership validation, AI calls, data persistence
- Depends on: NextAuth, Prisma, AI layer, limits
- Used by: Client components via fetch
- Purpose: OAuth providers (Google, GitHub) + session management
- Location: `src/auth.ts`
- Contains: NextAuth v5 config, Google + GitHub providers, Prisma adapter
- Depends on: NextAuth v5, Prisma
- Used by: All API routes, session pages
- Purpose: Tier-aware rate limiting (session-level and daily)
- Location: `src/lib/limits.ts`, `src/lib/daily-limits.ts`
- Contains: `LIMITS` constant (free/pro/premium), daily reset logic
- Depends on: Prisma (for daily counter reset), enum `Tier`
- Used by: Hint and score routes
## Data Flow
- **Server-authoritative:** `hintsUsed`, `scoresUsed`, `canvasState`, `chatHistory`, `scoreResult` (stored in `InterviewSession`)
- **Client-cached:** Zustand holds copies, synced FROM server responses after API calls
- **Local-only fallback:** IndexedDB mirrors session data; used if server unreachable
- **Derived state:** `unreadHintCount`, `isScoring`, `isAiThinking` calculated in Zustand
## Key Abstractions
- Purpose: Represent architecture as vendor nodes, labeled edges, text annotations
- Examples: `src/types/index.ts` (interface definition), `src/lib/graph-parser.ts` (construction)
- Pattern: Output of `parseCanvasToGraph()`, never modified, passed to all AI endpoints
- Critical: Shape must match across graph-parser, ai.ts, and all API routes
- Purpose: Metadata attached to tldraw shapes (vendor, category, label, isLabeled)
- Examples: `src/components/canvas/shapes/*Shape.tsx` (define shapes with meta)
- Pattern: Type guard `hasShapeMeta()`, used to filter vendor vs. generic nodes
- Purpose: 15 system design questions with scoring rubric
- Examples: `src/lib/prompts.ts` (constant array, indexed by tier)
- Pattern: `PROMPTS[index]` contains id, title, description, hints about scalability/reliability/etc.
- Usage: Passed to AI prompt builders, indexed by `promptId` in routes
- Purpose: Persist session state per user per question
- Location: `prisma/schema.prisma`
- Fields: `userId`, `promptId` (unique pair), `canvasState`, `chatHistory`, `scoreResult`, `hintsUsed`, `scoresUsed`, `status`
- Constraint: `@@unique([userId, promptId])` ensures one session per question per user
- Refreshing browser hits this session, limits NOT reset
- Purpose: User or AI message in the interview chat
- Examples: `src/types/index.ts`
- Pattern: `id`, `role` ("ai" or "user"), `content`, `timestamp`, optional `model`
- Used: In `useSessionStore.messages`, sent as history to AI endpoints
- Purpose: Background hint triggered by graph change
- Examples: `src/types/index.ts`
- Pattern: `id`, `content`, `triggeredAt` (canvas version), `isRead`
- Used: In `useSessionStore.hints`, displayed in `HintBubble`, separate from chat
## Entry Points
- Location: `src/app/layout.tsx`
- Triggers: User visits `/`
- Responsibilities: Root layout, session provider, auth context
- Location: `src/app/page.tsx`
- Triggers: User at `/` or unauthenticated
- Responsibilities: Show prompt selector, login button, pricing info
- Location: `src/app/session/[id]/page.tsx`
- Triggers: POST `/api/session/start` → redirect to `/session/[sessionId]`
- Responsibilities: Initialize session state, render canvas + chat + notes, handle autosave, scoring
- Location: `src/app/api/session/start/route.ts`
- Triggers: Client POST with `promptId`
- Responsibilities: Auth check → upsert `InterviewSession` → return session metadata
- Location: `src/app/api/ai/hint/route.ts`
- Triggers: Client POST with `sessionId`, `graph`, `history`, `llmProvider`
- Responsibilities: Auth → ownership → tier limit → daily limit → generate hint → increment DB counter
- Location: `src/app/api/ai/score/route.ts`
- Triggers: Client POST with `sessionId`, `graph`, `history`, `llmProvider`
- Responsibilities: Same auth/limit checks → build prompt → stream JSON → client parses
- Location: `src/app/api/session/[id]/canvas/route.ts`
- Triggers: Session page autosave timer (debounced 3s)
- Responsibilities: Auth → ownership → update `InterviewSession.canvasState` with snapshot
## Error Handling
- **Unauthorized (401):** API returns `{ error: "unauthorized" }` → client redirects to login
- **Forbidden (403):** Ownership check failed → return `{ error: "forbidden" }`
- **Free limit (403):** Session limit reached → return `{ error: "free_limit_reached", hintsUsed/scoresUsed }` → client shows upgrade prompt
- **Daily limit (403):** Return `{ error: "daily_limit_reached", message: "..." }` → client shows specific message
- **Quota (429):** AI provider rate limit → caught in score route → return 429 → client shows "quota exceeded, try again"
- **Truncated JSON (score route):** Response doesn't end with `}` → parse fails → client shows "Invalid response from AI"
- **Server save fails (canvas):** DB PATCH fails → IndexedDB fallback invoked → console.warn, no user error
- `ScoreResult` has optional `error` and `isQuotaError` flags
- `Hint` is opaque string; errors shown as special hint messages
- Chat errors shown as system messages
## Cross-Cutting Concerns
- Use `console.warn()` for recoverable issues (IndexedDB failure, server save fallback)
- Use `console.error()` for real failures (auth errors, parse failures)
- Never use `console.log()` in committed code
- Log AI errors before returning to client
- Graph validity checked in `graph-parser.ts` (unlabeled edges/shapes)
- Canvas validation in `src/components/canvas/validation/useShapeValidator.ts`
- All API inputs type-checked server-side before use
- Streaming JSON sanitized before parsing (strip markdown, check end character)
- Every API route starts with `const session = await auth()`
- Check `session?.user?.id` exists and is string
- All routes check ownership (`userId === session.user.id`)
- Tier read fresh from DB on each limit check (token may be stale)
- Session-level: `hintsUsed >= LIMITS.free.aiHintsPerSession` (read from DB)
- Daily-level: `checkAndIncrementDailyHints()` — atomic operation on `User.dailyHintsUsed`
- Pro/Premium: infinite limits in code (`Infinity`)
- Client side checks only warn; server side enforces
- No raw tldraw JSON sent to AI (only `SemanticGraph`)
- No client-controlled hintsUsed/scoresUsed in request body
- No localStorage (use IndexedDB)
- Secrets in env vars only (ANTHROPIC_API_KEY, etc.) — never in response
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
