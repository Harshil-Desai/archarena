# Codebase Structure

**Analysis Date:** 2026-04-15

## Directory Layout

```
archarena/
├── src/
│   ├── app/                         # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   ├── ai/hint/route.ts              # POST: generate hint from graph
│   │   │   ├── ai/score/route.ts             # POST: stream score result
│   │   │   ├── session/start/route.ts        # POST: init/upsert interview session
│   │   │   ├── session/[id]/canvas/route.ts  # PATCH: save canvas snapshot
│   │   │   ├── session/[id]/chat/route.ts    # POST: save chat message
│   │   │   ├── session/[id]/route.ts         # GET: fetch session metadata
│   │   │   ├── billing/checkout/route.ts     # POST: LemonSqueezy checkout
│   │   │   ├── billing/webhook/route.ts      # POST: LemonSqueezy subscription events
│   │   │   └── history/route.ts              # GET: fetch session history
│   │   ├── billing/                          # Billing pages (Pro/Premium)
│   │   ├── history/                          # Session history page
│   │   ├── session/[id]/                     # Main interview canvas page
│   │   ├── login/                            # OAuth login page
│   │   ├── pricing/                          # Pricing/upgrade page
│   │   ├── page.tsx                          # Home page (prompt selector)
│   │   ├── layout.tsx                        # Root layout (SessionProvider, fonts)
│   │   └── globals.css                       # Tailwind + custom styles
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── InterviewCanvas.tsx           # Main tldraw wrapper + debounced save
│   │   │   ├── shapes/                       # Custom vendor shapes (PostgreSQL, Redis, etc.)
│   │   │   │   ├── *Shape.tsx                # 15+ vendor shapes with meta props
│   │   │   │   ├── GenericShape.tsx          # Rectangle/circle/diamond/cylinder
│   │   │   │   └── index.ts                  # CUSTOM_SHAPE_UTILS export
│   │   │   ├── toolbar/
│   │   │   │   └── VendorToolbar.tsx         # Shape insertion UI
│   │   │   ├── validation/
│   │   │   │   ├── useCanvasValidation.ts    # Check for unlabeled shapes/edges
│   │   │   │   └── useShapeValidator.ts      # Individual shape validation
│   │   │   └── hints/
│   │   │       └── CanvasHintOverlay.tsx     # Hint bubble on canvas
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx                 # Main chat container + hint requests
│   │   │   ├── ChatMessage.tsx               # Single message UI (user/AI)
│   │   │   ├── ChatInput.tsx                 # User message input
│   │   │   └── HintBubble.tsx                # Hint notification UI
│   │   ├── score/
│   │   │   ├── ScorePanel.tsx                # Score breakdown + feedback display
│   │   │   └── ScoreBreakdown.tsx            # Score chart visualization
│   │   ├── session/
│   │   │   ├── SessionLayout.tsx             # 3-pane layout (canvas + chat + notes)
│   │   │   └── ExportButton.tsx              # Export canvas as PNG/SVG
│   │   ├── notes/
│   │   │   └── NotesPanel.tsx                # Markdown notes editor
│   │   ├── prompt/
│   │   │   ├── PromptSelector.tsx            # Select design question
│   │   │   └── PromptBadge.tsx               # Prompt title + difficulty badge
│   │   ├── auth/
│   │   │   └── UserMenu.tsx                  # Login/logout/profile menu
│   │   └── ui/
│   │       └── (shadcn/radix-ui components)  # Reusable UI components
│   ├── lib/
│   │   ├── ai.ts                             # Model routing, prompt builders, streaming
│   │   ├── graph-parser.ts                   # tldraw → SemanticGraph conversion
│   │   ├── prompts.ts                        # 15 design questions + FREE_PROMPT_COUNT
│   │   ├── limits.ts                         # LIMITS constant (tier-aware quotas)
│   │   ├── daily-limits.ts                   # Daily counter reset logic
│   │   ├── prisma.ts                         # Prisma singleton (PrismaClient)
│   │   ├── indexeddb.ts                      # Browser IndexedDB wrapper
│   │   ├── lemonsqueezy.ts                   # LemonSqueezy SDK init
│   │   └── socket-client.ts                  # WebSocket (unused)
│   ├── store/
│   │   └── session.ts                        # Zustand session state store
│   ├── types/
│   │   └── index.ts                          # SemanticGraph, Hint, ChatMessage, etc.
│   ├── auth.ts                               # NextAuth v5 config (Google + GitHub OAuth)
│   └── proxy.ts                              # Request/response proxy utilities
├── prisma/
│   ├── schema.prisma                         # Postgres schema (User, InterviewSession, etc.)
│   └── migrations/                           # Prisma migration history
├── public/
│   └── icons/                                # SVG icons (vendor shapes, categories)
├── package.json                              # Dependencies (Next.js, tldraw, Zustand, etc.)
├── tsconfig.json                             # TypeScript config (strict: true)
├── next.config.ts                            # Next.js config
├── tailwind.config.ts                        # Tailwind CSS (dark mode)
├── CLAUDE.md                                 # Architecture decisions & conventions
└── .env.example                              # Required env vars template
```

## Directory Purposes

**src/app/api/ai/:**
- Purpose: AI endpoint orchestration (hints and scoring)
- Contains: Route handlers that auth, validate, call AI models, stream responses
- Key files: `hint/route.ts` (POST, JSON response), `score/route.ts` (POST, ReadableStream)

**src/app/api/session/:**
- Purpose: Session CRUD operations
- Contains: Session start (upsert), canvas save, chat message log, session fetch
- Key files: `start/route.ts` (init), `[id]/canvas/route.ts` (autosave), `[id]/route.ts` (read)

**src/components/canvas/shapes/:**
- Purpose: Vendor-specific tldraw shapes (PostgreSQL, Redis, Kafka, etc.)
- Contains: 15+ shape components with `ShapeMeta` props (vendor, category, label)
- Key files: All `*Shape.tsx` files define custom geometry + SVG rendering + meta
- Import path: `src/components/canvas/shapes/index.ts` exports `CUSTOM_SHAPE_UTILS`

**src/lib/:**
- Purpose: Core business logic, no React components here
- Contains: Graph parsing, AI prompt builders, Prisma singleton, limit checkers
- Key files:
  - `graph-parser.ts` — tldraw records → SemanticGraph (NEVER bypass this)
  - `ai.ts` — model routing, prompt formatting, stream creation
  - `limits.ts` — `LIMITS` constant (single source of truth)
  - `prompts.ts` — 15 questions, indexed by tier

**src/store/:**
- Purpose: Client-side state management
- Contains: Zustand session store (canvas state, hints, chat, scores, timer)
- Key files: `session.ts` is the only store; all session state lives here

**prisma/:**
- Purpose: Database schema and migrations
- Contains: Postgres schema (User, InterviewSession, etc.), migration history
- Key files: `schema.prisma` (source of truth), `migrations/` (audit trail)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout (fonts, SessionProvider, auth context)
- `src/app/page.tsx`: Home page (prompt selector, login gate)
- `src/app/session/[id]/page.tsx`: Main interview page (canvas + chat + notes)

**Configuration:**
- `src/auth.ts`: NextAuth v5 setup (Google, GitHub providers, PrismaAdapter)
- `src/lib/limits.ts`: Tier-aware limits (single source of truth for quotas)
- `prisma/schema.prisma`: Postgres schema (User, InterviewSession, Tier enum)

**Core Logic:**
- `src/lib/graph-parser.ts`: tldraw → SemanticGraph (critical, never bypass)
- `src/lib/ai.ts`: Prompt builders + model routing + streaming
- `src/store/session.ts`: Zustand session state (all UI state here)

**Canvas:**
- `src/components/canvas/InterviewCanvas.tsx`: tldraw wrapper + autosave
- `src/components/canvas/shapes/`: 15+ vendor shape components
- `src/components/canvas/validation/useCanvasValidation.ts`: Unlabeled check

**Chat & AI:**
- `src/components/chat/ChatPanel.tsx`: Chat UI + hint request logic
- `src/app/api/ai/hint/route.ts`: Hint generation endpoint
- `src/app/api/ai/score/route.ts`: Score streaming endpoint

**Testing:**
- None committed (no test files found)
- Strategy: Write unit tests for graph-parser, AI prompt builders, limits logic

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js App Router)
- API routes: `route.ts` (Next.js convention)
- Components: `PascalCase.tsx` (React)
- Utilities: `camelCase.ts` (functions/constants)
- Hooks: `use*.ts` (Zustand store or React hooks)
- Types: Exported from `src/types/index.ts` (centralized)

**Directories:**
- Feature directories: lowercase plural (e.g., `components/canvas`, `api/session`)
- Dynamic routes: `[param]` (Next.js App Router)
- Grouping (not in URL): `(name)` (Next.js App Router feature, not used here)

**Functions/Variables:**
- Exported functions: camelCase (e.g., `parseCanvasToGraph`, `generateAnthropicHint`)
- React components: PascalCase (e.g., `InterviewCanvas`, `ChatPanel`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `LIMITS`, `MODEL_MAP`)
- Zustand store: `use*` prefix (e.g., `useSessionStore`)

**Types:**
- Interfaces: PascalCase, exported from `src/types/index.ts`
- Type unions: PascalCase (e.g., `ShapeCategory`, `AIModel`)
- Props interfaces: `{ComponentName}Props` (e.g., `ChatPanelProps`)

## Where to Add New Code

**New Feature (e.g., Export as PDF):**
- Primary code: `src/components/session/` (new component or update `ExportButton.tsx`)
- Styling: Tailwind in JSX (no inline styles)
- Type definitions: Add to `src/types/index.ts` if needed
- Tests: `__tests__/components/session/` (create if needed)

**New Component/Module:**
- React component: `src/components/{feature}/{ComponentName}.tsx` with `"use client"` if hooks
- Utility: `src/lib/{name}.ts` (no React here)
- Store action: Add method to `useSessionStore` in `src/store/session.ts`

**New API Route:**
- Route: `src/app/api/{feature}/{name}/route.ts`
- Always start with `const session = await auth()`
- Always check ownership before reading/writing user data
- Return errors with correct status codes (401, 403, 429)

**New Database Model:**
- Schema: Add to `prisma/schema.prisma`
- Migration: Run `npx prisma migrate dev --name {description}`
- Singleton access: Use `import { prisma } from "@/lib/prisma"` in routes
- Never instantiate `new PrismaClient()` elsewhere

**Utilities:**
- Shared helpers: `src/lib/{name}.ts`
- Type-only utilities: `src/types/index.ts`
- React hooks: `src/components/{feature}/use*.ts`

## Special Directories

**public/icons/:**
- Purpose: SVG icons for vendor shapes and categories
- Generated: No (manually added)
- Committed: Yes
- Usage: Imported in shape components, displayed on canvas

**prisma/migrations/:**
- Purpose: Audit trail of all schema changes
- Generated: By `npx prisma migrate dev`
- Committed: Yes (always commit migrations)
- Never edit manually — always use `prisma migrate` commands

**node_modules/:**
- Generated: Yes (from package.json)
- Committed: No
- Key packages: `@tldraw/tldraw`, `zustand`, `next-auth`, `@prisma/client`

**.next/:**
- Generated: Yes (build output)
- Committed: No
- Generated during: `npm run build`

## Import Path Aliases

From `tsconfig.json`:
- `@/` → `src/` (e.g., `import { prisma } from "@/lib/prisma"`)
- No other aliases defined

Always use `@/` for imports (never relative paths like `../../../lib/utils`).

## Type Exports

All shared types exported from `src/types/index.ts`:
- `SemanticGraph`, `SemanticNode`, `SemanticEdge`, `Annotation`
- `ChatMessage`, `Hint`, `ScoreResult`
- `AIModel`, `LlmProvider`, `ShapeMeta`, `ShapeCategory`, `Tier`

Never define types inline in components. Always add to `src/types/index.ts`.

## Barrel Files

**src/components/canvas/shapes/index.ts:**
```typescript
export { CUSTOM_SHAPE_UTILS } from './...'
```
- Exports all shape components bundled for tldraw integration
- Update when adding new vendor shapes

**No other barrel files in use.**

## Client vs. Server Boundaries

**"use client" required:**
- `src/app/session/[id]/page.tsx` — uses useSession, useRouter hooks
- All `src/components/**/*.tsx` — use Zustand, useEffect, onClick, etc.

**"use server" not used** — but routes in `src/app/api/` are server-only by default.

**Never cross boundaries:**
- Routes cannot import client components (Next.js will error)
- Client pages cannot import Prisma (will leak credentials to browser)

---

*Structure analysis: 2026-04-15*
