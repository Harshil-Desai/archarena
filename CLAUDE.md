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