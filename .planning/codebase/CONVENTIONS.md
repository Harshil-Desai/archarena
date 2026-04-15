# Coding Conventions

**Analysis Date:** 2026-04-15

## Naming Patterns

**Files:**
- API routes follow Next.js convention: `src/app/api/[path]/route.ts`
- Components use PascalCase: `DatabaseShape.tsx`, `ChatPanel.tsx`, `PromptSelector.tsx`
- Utility/hook files use camelCase: `useCanvasValidation.ts`, `useSessionStore.ts`
- Library modules use camelCase: `graph-parser.ts`, `indexeddb.ts`, `daily-limits.ts`

**Functions:**
- Camel case for all functions: `formatGraphForPrompt()`, `truncateGraphForAI()`, `distanceBetween()`
- Utility functions with leading underscore for private/internal: `_geminiClient` (module-level)
- Hook pattern: `use[Feature]` e.g. `useCanvasValidation()`, `useSessionStore()`
- Factory functions: `getDB()`, `getGeminiClient()`, `getShapeCenter()`

**Variables:**
- Camel case for all variables and constants
- Module-level constants in UPPER_SNAKE_CASE for finite sets: `LIMITS`, `PROMPTS`, `LIMITS_AI`
- Type predicates use `is` prefix: `hasShapeMeta()`, `isVendorShape()`, `isGenericShape()`, `isTextShape()`

**Types:**
- Interfaces for object shapes: `ShapeMeta`, `SemanticGraph`, `ChatMessage`, `DesignPrompt`
- Type unions with string literals (no enums): `type AIModel = "haiku" | "flash" | "sonnet"`
- Discriminated unions: `role: "ai" | "user"`, `difficulty: "easy" | "medium" | "hard"`
- Generic type parameters in uppercase: `<SessionState>`, `<Geometry2d>`

## Code Style

**Formatting:**
- No Prettier config found — using ESLint config-next defaults
- 2-space indentation (consistent in examples)
- Line breaks after `{` and before `}`
- Trailing commas in multi-line arrays/objects

**Linting:**
- ESLint with `eslint-config-next` (core-web-vitals + TypeScript configs)
- Config: `eslint.config.mjs`
- Run: `npm run lint`
- No console.log in committed code — use `console.warn()` or `console.error()` only

## Import Organization

**Order:**
1. External packages (`react`, `next`, `zustand`, `@anthropic-ai/sdk`)
2. Type imports from `@/types`
3. Lib/utils from `@/lib`
4. Store from `@/store`
5. Components from `@/components`
6. Local types/interfaces

**Path Aliases:**
- `@/*` → `./src/*` (defined in tsconfig.json)
- Used throughout: `import { prisma } from "@/lib/prisma"`

**Example:**
```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateAnthropicHint, truncateGraphForAI } from "@/lib/ai"
import { LIMITS } from "@/lib/limits"
import type { LlmProvider, SemanticGraph } from "@/types"
```

## Error Handling

**HTTP API Routes:**
- First line: `const session = await auth()` — always check auth
- Return standardized JSON error responses:
  ```typescript
  { error: "unauthorized" } with status 401
  { error: "forbidden" } with status 403
  { error: "free_limit_reached" } with status 403 (includes limit count)
  { error: "session_not_found" } with status 404
  { error: "promptId is required" } with status 400
  { error: "ai_failed", message: "..." } with status 500
  ```
- Ownership check before DB operations: `if (record.userId !== session.user.id) return 403`
- DB limits are source of truth — never trust client

**Try-Catch Blocks:**
- AI call errors logged with `console.error("[context]", err)` using bracket prefix for filtering
- Database errors logged as context e.g. `console.error("[webhook] DB update failed:", error)`
- Catch JSON parse errors explicitly: `JSON.parse(...).catch(() => ({}))`
- IndexedDB failures are non-fatal: `catch (error) { console.warn("IndexedDB...", error); return false }`

**Error Messages:**
- Specific error codes for UI handling: `"free_limit_reached"`, `"daily_limit_reached"`, `"quota_exceeded"`
- User-facing: descriptive strings e.g. `"Daily hint limit reached. Resets in 24 hours."`
- Validation messages include counts: `"Label all components before asking for a hint (2 unlabeled shapes)"`

## Logging

**Framework:** Native `console` (no external logging library)

**Patterns:**
- `console.error("[scope] message", error)` — failures and exceptions
- `console.warn("message", data)` — recoverable issues or non-fatal failures
- No `console.log()` in any committed code
- Bracket prefixes for filtering: `[checkout]`, `[webhook]`, `[export]`, `[billing]`

**Example from codebase:**
```typescript
console.error("Hint AI error:", err)
console.warn("IndexedDB open failed", error)
console.error(`[webhook] DB update failed for ${eventName}:`, error)
```

## Comments

**When to Comment:**
- Justify non-obvious decisions (from CLAUDE.md): "DB is source of truth for limits — never the client"
- Mark temporary workarounds with `// Fallback to plain text prop`
- Explain complex algorithms: `// Rich text extraction` blocks
- TODO/FIXME comments not found in codebase — avoid

**JSDoc/TSDoc:**
- No JSDoc comments found in codebase
- Interfaces document themselves through type names and property comments
- Complex functions documented inline with section headers: `// ─── Shape type guards ────────────────────`

**Example:**
```typescript
// 2. Ownership check
if (interviewSession.userId !== session.user.id) {
  return NextResponse.json(
    { error: "forbidden" },
    { status: 403 }
  )
}

// Truncate inputs before they reach the AI (defense in depth)
const graph = truncateGraphForAI(rawGraph)
```

## Function Design

**Size:**
- Most utility functions under 30 lines
- API routes structured in numbered comment blocks (1-8 steps)
- Component functions use smaller extracted sub-components: `LabelEditor()`, `BreakdownBar()`

**Parameters:**
- Interfaces for object parameters: `{ shape: DatabaseShapeType }`
- Type destructuring in params: `{ params }: { params: Promise<{ id: string }> | { id: string } }`
- Callback parameters with specific types not unions

**Return Values:**
- API routes return `NextResponse.json()`
- Predicates return boolean: `hasShapeMeta(): shape is ShapeWithMeta`
- Utility functions return typed objects: `{ canRequestHint: boolean, reason: string | null }`
- Async functions return promises: `Promise<IDBDatabase | null>`, `Promise<boolean>`

## Module Design

**Exports:**
- Named exports used throughout: `export const LIMITS`, `export function getDB()`
- Re-export from barrel file: `src/components/canvas/shapes/index.ts` exports all shape utilities
- No default exports found

**Barrel Files:**
- `src/components/canvas/shapes/index.ts` — aggregates all shape utilities
- Single source of truth for type definitions: `src/types/index.ts`
- Single source of truth for prompts: `src/lib/prompts.ts`
- Single source of truth for limits: `src/lib/limits.ts`

## TypeScript Strict Mode

**Rules:**
- Strict mode enabled (tsconfig: `"strict": true`)
- No `any` without justifying comment
- Non-null assertions (`!`) avoided except with justifying comment: `// Guaranteed by X check above`
- Type guards used for runtime validation: `hasShapeMeta(shape): shape is ShapeWithMeta`
- `as const` for immutable tuples and literal types: `LIMITS` and `PROMPTS` use `as const`

**Example:**
```typescript
// Casting shape to wider type with explicit guard
const shape = shape as TLShape & {
  props: TLShape["props"] & {
    meta: ShapeMeta
  }
}

// Any type with justifying comment
catch (err: unknown) { // any: error shape varies between Anthropic and Gemini SDKs
  const status = streamInitError?.status ?? 500
}
```

## Component-Specific Conventions

**Client Components:**
- "use client" pragma only when using hooks or browser APIs
- Destructure hooks at component top: `const sessionId = useSessionStore((s) => s.sessionId)`
- Zustand subscription pattern: `(s) => s.property` for dependency tracking
- Business logic in hooks or store, not in JSX

**Example from `ChatPanel.tsx`:**
```typescript
"use client";

const sessionId = useSessionStore((s) => s.sessionId);
const activePrompt = useSessionStore((s) => s.activePrompt);
const setAiThinking = useSessionStore((s) => s.setAiThinking);
```

**Styling:**
- Tailwind CSS only (no inline styles except tldraw overrides)
- Dark theme base: `bg-gray-950` (mentioned in CLAUDE.md)
- Semantic color classes: `text-emerald-300`, `border-red-500`, `bg-amber-900/30`
- Flex utilities: `flex items-center justify-between`, `gap-3`

---

*Convention analysis: 2026-04-15*
