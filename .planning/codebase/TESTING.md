# Testing Patterns

**Analysis Date:** 2026-04-15

## Test Framework

**Current Status:** No test framework currently configured

**Investigation:**
- No test files found: `grep -r "*.test.*" "*.spec.*"` returned no matches in `src/`
- No test configuration: `jest.config.*`, `vitest.config.*` files not present
- No test dependencies in `package.json`: no `jest`, `vitest`, `@testing-library/*`
- No test scripts defined in `package.json` beyond `"lint"`

**Recommendation:** Test infrastructure needs to be established as a priority.

## Testing Architecture (Needed)

Based on codebase structure and conventions, when tests are added, follow this guidance:

### Test File Organization

**Location:** Co-locate tests with implementation

**Pattern:**
- API routes: `src/app/api/[route]/route.ts` → `src/app/api/[route]/route.test.ts`
- Utilities: `src/lib/ai.ts` → `src/lib/ai.test.ts`
- Hooks: `src/components/canvas/validation/useCanvasValidation.ts` → `src/components/canvas/validation/useCanvasValidation.test.ts`
- Components: `src/components/chat/ChatPanel.tsx` → `src/components/chat/ChatPanel.test.tsx`

**Naming:** `[filename].test.ts` or `[filename].test.tsx`

## Critical Systems Requiring Tests

### 1. SemanticGraph Generation (`src/lib/graph-parser.ts`)

**Why critical:**
- Converts raw tldraw JSON to AI-safe semantic format (mentioned in CLAUDE.md)
- Every AI endpoint depends on this conversion
- Shape type guards and validation must be bulletproof

**What to test:**
- `hasShapeMeta()` type guard: valid/invalid shape metadata
- `isVendorShape()`, `isGenericShape()`, `isTextShape()` classification
- `richTextToPlainText()`: rich text extraction from various tldraw text formats
- `distanceBetween()`: geometric distance calculations for annotation association
- `attachAnnotationDescriptions()`: proximity detection and labeling (240px threshold)
- Full `parseGraphFromTldraw()` integration with edge cases:
  - Empty canvas (0 nodes)
  - Canvas with only text shapes (no vendors)
  - Mixed labeled/unlabeled edges
  - Orphaned annotations (no nearby nodes)

**Coverage goal:** >90% — this function is the data contract between canvas and AI

### 2. AI Prompt Building and Truncation (`src/lib/ai.ts`)

**Why critical:**
- Prevents token overflow on API calls
- Malformed prompts confuse the AI scorer
- Directly impacts scoring quality

**What to test:**
- `truncateGraphForAI()`: respects all limits
  - `maxNodes: 20`, `maxEdges: 30`, `maxAnnotations: 5`
  - `maxLabelLength: 60`, `maxEdgeLabelLength: 80`, `maxAnnotationLength: 200`
- `truncateHistoryForAI()`: keeps last N messages, truncates content
  - `maxHistoryMessages: 6`, `maxHistoryMessageLength: 300`
- `formatGraphForPrompt()`: produces readable AI prompt
  - Separates vendor nodes from generic shapes
  - Lists edges with labels
  - Includes unlabeled counts
- Model routing: `MODEL_MAP["haiku"]`, `MODEL_MAP["sonnet"]` map correctly
- GEMINI_MODEL_MAP consistency (currently both flash)

**Coverage goal:** >85% — truncation errors leak into AI, causing failures

### 3. API Route Authorization (`src/app/api/*/route.ts`)

**Why critical:**
- Prevents unauthorized access to user sessions
- Prevents limit bypass attacks
- Enforces DB-as-source-of-truth pattern

**Pattern to test (present in all API routes):**
```typescript
// 1. Auth check
const session = await auth()
if (!session?.user?.id) return 401

// 2. DB lookup + ownership
const record = await prisma.[entity].findUnique(...)
if (record.userId !== session.user.id) return 403

// 3. Limit enforcement from DB, not client
if (record.hintsUsed >= limit) return 403
```

**Routes requiring tests:**
- `src/app/api/ai/hint/route.ts`: hint limit (session + daily)
- `src/app/api/ai/score/route.ts`: score limit (session + daily) + streaming
- `src/app/api/session/[id]/chat/route.ts`: chat message append
- `src/app/api/session/[id]/canvas/route.ts`: canvas state persistence
- `src/app/api/session/start/route.ts`: session upsert (maintains state on refresh)

**Test structure:**
```typescript
describe("POST /api/ai/hint", () => {
  it("returns 401 if not authenticated")
  it("returns 403 if user doesn't own session")
  it("returns 403 if session-level limit reached")
  it("returns 403 if daily limit reached")
  it("increments hintsUsed atomically on success")
  it("returns hint + server-authoritative count")
  it("handles AI provider errors gracefully")
})
```

### 4. Limit Enforcement (`src/lib/limits.ts`)

**Why critical:**
- Defines FREE tier vs PRO tiers
- Directly tied to revenue (upgrade gate)
- Off-by-one errors break monetization

**What to test:**
- Tier detection: FREE, PRO, PREMIUM
- Tier-specific limits:
  - `free.aiHintsPerSession: 5`
  - `free.scoresPerSession: 1`
  - `pro.aiHintsPerSession: Infinity`
- Atomic increment: `{ increment: 1 }` in Prisma updates
- Daily limit checks: `checkAndIncrementDailyHints()`, `checkAndIncrementDailyScores()`

**Coverage goal:** 100% — no off-by-one bugs allowed

### 5. Canvas Validation Hook (`src/components/canvas/validation/useCanvasValidation.ts`)

**Why critical:**
- Gates hint requests
- User-facing error messages
- Validates canvas state before API call

**What to test:**
```typescript
describe("useCanvasValidation", () => {
  it("returns canRequestHint: false if no session")
  it("returns canRequestHint: false if graph is null")
  it("returns canRequestHint: false if 0 nodes")
  it("returns canRequestHint: false if unlabeled shapes exist")
  it("returns reason with count of unlabeled shapes")
  it("allows hints even with unlabeled edges")
  it("returns canRequestHint: true when valid")
})
```

### 6. Session State Sync (Zustand `src/store/session.ts`)

**Why critical:**
- Client-side mirror of DB state
- Must stay in sync after each API response
- Stale state causes limit bypass or overcounting

**What to test:**
- `syncFromServer()`: merges server response into store
- `incrementHintsUsed()` / `incrementScoresUsed()`: optimistic updates
- `syncHintsFromServer()` / `syncScoresFromServer()`: corrects after API response
- `setScoreResult()`: updates scoring breakdown
- `addHint()`: appends hint and increments unread count

**Pattern:**
```typescript
const store = useSessionStore()
act(() => {
  store.syncFromServer({
    sessionId: "123",
    hintsUsed: 2,
    scoresUsed: 1,
    // ...
  })
})
expect(store.sessionId).toBe("123")
expect(store.hintsUsed).toBe(2)
```

### 7. IndexedDB Fallback (`src/lib/indexeddb.ts`)

**Why critical:**
- Non-fatal but silent failures cause data loss
- Browser storage is the last resort if DB is down

**What to test:**
- `saveSessionLocally()`: persists snapshot
- `loadSessionLocally()`: retrieves snapshot
- `clearSessionLocally()`: deletes session
- `getUiFlag()` / `setUiFlag()`: one-time UI state (e.g., "show onboarding")
- Non-fatal on IndexedDB unavailability: returns `false` or `null`, logs `console.warn()`
- Proper database closing: `db.close()` in finally blocks

## Testing Best Practices (When Implemented)

**Mocking Strategy:**

For API routes, mock Prisma operations:
```typescript
jest.mock("@/lib/prisma", () => ({
  prisma: {
    interviewSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))
```

For Zustand store tests, use store directly without React:
```typescript
import { useSessionStore } from "@/store/session"

describe("useSessionStore", () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessionId: null,
      hintsUsed: 0,
      // reset to defaults
    })
  })
})
```

**What NOT to Mock:**
- Type guards and predicates: test them directly
- Utility functions like `truncateGraphForAI()`: test with real data
- Zustand actions: test mutation patterns with `act()`

**Async Testing:**

For API routes with `NextRequest`:
```typescript
const res = await POST(
  new NextRequest("http://localhost:3000/api/ai/hint", {
    method: "POST",
    body: JSON.stringify({ sessionId, graph, history }),
  }),
  { params: Promise.resolve({ id: "123" }) }
)
```

For streaming responses (score route):
```typescript
stream = await createScoringStream(prompt, provider)
const reader = stream.getReader()
const { value } = await reader.read()
const chunk = new TextDecoder().decode(value)
```

## Error Scenarios to Test

**Network failures:**
- AI API timeout (quota exceeded)
- Prisma connection error
- IndexedDB unavailable

**Data validation:**
- Truncated/incomplete AI JSON responses
- Malformed SemanticGraph from tldraw
- Missing required fields in request body

**Concurrency:**
- Two simultaneous hint requests (increment should be idempotent)
- Canvas update while scoring
- Session refresh during active hint generation

## Coverage Targets

- **Critical paths** (authorization, limits, graph parsing): >90%
- **API routes**: >80%
- **UI components**: >60% (interactive tests are expensive)
- **Utility functions**: >85%

## Run Commands (Once Configured)

```bash
npm run test                # Run all tests
npm run test -- --watch     # Watch mode
npm run test -- --coverage  # Generate coverage report
```

---

*Testing analysis: 2026-04-15*

**Note:** This codebase currently has zero test coverage. Establishing test infrastructure is a critical next step, particularly for the authorization layer, graph parsing, and limit enforcement systems that directly impact security and revenue.
