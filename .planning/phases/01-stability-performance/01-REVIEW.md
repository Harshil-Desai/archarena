---
phase: 01-stability-performance
reviewed: 2026-04-15T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/lib/graph-parser.ts
  - src/lib/ai.ts
  - src/lib/daily-limits.ts
  - src/components/canvas/InterviewCanvas.tsx
  - src/app/session/[id]/page.tsx
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-15
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This phase introduced three bug fixes (canvas save storms, Gemini model misconfiguration, daily limit race condition) plus a structural diff optimization and dynamic tldraw import. The canvas debounce/diff logic and dynamic import are correctly implemented. However, the daily limit "atomic" fix still has a TOCTOU gap between the reset and increment operations, and a client-side limit bypass exists in the score handler that exposes PRO/PREMIUM users to the free tier cap. Several additional issues affect robustness, correctness, and type safety.

---

## Critical Issues

### CR-01: Daily limit reset and increment are not in a transaction — TOCTOU window remains

**File:** `src/lib/daily-limits.ts:15-24`

**Issue:** The "atomic reset" and the "atomic check+increment" are two separate `updateMany` calls with no database transaction wrapping them. Between call 1 (the reset) and call 2 (the increment), a concurrent request for the same user can slip through: the second request sees `dailyHintsUsed = 0` after the reset and increments, then the first request also increments, effectively granting two hints against what should count as one reset cycle. Under low-to-medium concurrency (a user with multiple browser tabs open) this is reliably exploitable to exceed the daily limit.

**Fix:** Wrap both operations in a Prisma interactive transaction:

```typescript
export async function checkAndIncrementDailyHints(
  userId: string,
  tier: "FREE" | "PRO" | "PREMIUM"
): Promise<{ allowed: boolean; remaining: number }> {
  const tierKey = tier === "PREMIUM" ? "pro" : tier.toLowerCase() as "free" | "pro"
  const dailyLimit = LIMITS[tierKey].aiHintsPerDay

  const now = new Date()
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  return prisma.$transaction(async (tx) => {
    // Reset if window expired
    await tx.user.updateMany({
      where: { id: userId, dailyLimitResetAt: { lt: cutoff } },
      data: { dailyHintsUsed: 0, dailyScoresUsed: 0, dailyLimitResetAt: now },
    })

    // Atomic check+increment
    const result = await tx.user.updateMany({
      where: { id: userId, dailyHintsUsed: { lt: dailyLimit } },
      data: { dailyHintsUsed: { increment: 1 } },
    })

    if (result.count === 0) {
      return { allowed: false, remaining: 0 }
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { dailyHintsUsed: true },
    })

    return {
      allowed: true,
      remaining: dailyLimit - (user?.dailyHintsUsed ?? dailyLimit),
    }
  })
}
```

Apply the same fix to `checkAndIncrementDailyScores`.

---

### CR-02: Score button enforces `LIMITS.free.scoresPerSession` for all tiers

**File:** `src/app/session/[id]/page.tsx:374`

**Issue:** `handleScoreClick` gates scoring with `if (scoresUsed >= LIMITS.free.scoresPerSession) return` regardless of the authenticated user's actual tier. PRO and PREMIUM users (whose `scoresPerSession` limit is `Infinity`) will be silently blocked after 1 score, exactly like free users. The server-side route will correctly allow them, but the client never sends the request.

**Fix:** Read the user's tier before comparing, or simply remove the client-side gate entirely (the server is the authoritative enforcer):

```typescript
// Remove this client-side gate — server enforces limits authoritatively.
// The server returns { error: "free_limit_reached" } when the limit is hit,
// which is already handled below at the 403 branch.
// if (scoresUsed >= LIMITS.free.scoresPerSession) return;  // DELETE THIS LINE
```

If a client-side guard is desired for UX (to disable the button), derive it from the server-synced limit returned in the session start response rather than hardcoding `LIMITS.free`.

---

## Warnings

### WR-01: `anthropicClient` instantiated at module load — crashes server if `ANTHROPIC_API_KEY` is absent

**File:** `src/lib/ai.ts:67`

**Issue:** `const anthropicClient = new Anthropic()` runs at import time, unconditionally. The Anthropic SDK reads `ANTHROPIC_API_KEY` from `process.env` in its constructor. If the key is missing (CI, staging without secrets, or cold-start before env is injected), importing `src/lib/ai.ts` throws, crashing the entire Next.js server process before any route can handle it gracefully. The Gemini client uses a lazy-init pattern correctly — Anthropic should too.

**Fix:** Lazily initialize the Anthropic client, mirroring the Gemini pattern:

```typescript
let _anthropicClient: Anthropic | null = null
function getAnthropicClient(): Anthropic {
  if (!_anthropicClient) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set")
    _anthropicClient = new Anthropic({ apiKey: key })
  }
  return _anthropicClient
}
```

Replace all direct uses of `anthropicClient` with `getAnthropicClient()`.

---

### WR-02: Unsafe cast on `message.content[0]` in Anthropic hint and chat functions

**File:** `src/lib/ai.ts:329`, `src/lib/ai.ts:344`

**Issue:** Both `generateAnthropicHint` and `generateAnthropicChatReply` cast `message.content[0]` directly to `{ type: "text"; text: string }`. If the API returns an empty `content` array (e.g., a stop_reason of `end_turn` with no text blocks — possible when the model hits the `stop_sequences` boundary before emitting any text) or a `tool_use` block, this silently returns `undefined` or throws, leaking an unhandled exception to the caller.

**Fix:** Add a guard before the cast:

```typescript
const block = message.content[0]
if (!block || block.type !== "text") {
  throw new Error(`Unexpected Anthropic response block type: ${block?.type ?? "empty"}`)
}
return block.text
```

---

### WR-03: Gemini scoring uses `maxOutputTokens: 10000` — 6.7x over the documented limit

**File:** `src/lib/ai.ts:422`

**Issue:** `createScoringStream` passes `maxOutputTokens: 10000` to Gemini Pro. CLAUDE.md documents the scoring token limit as 1500 max. At 10 000 tokens, a single score request can consume roughly 6.7x the intended budget. This directly violates the "avoid expensive API plans until paying users justify investment" constraint and risks quota exhaustion on a shared key.

**Fix:** Align with the documented limit:

```typescript
generationConfig: { maxOutputTokens: 1500 },
```

---

### WR-04: `require()` used inside a `useEffect` in a client component

**File:** `src/app/session/[id]/page.tsx:206`

**Issue:** The tier guard `useEffect` uses `require("@/lib/prompts")` — a synchronous CommonJS-style call inside an async React effect. In the Next.js App Router (ESM, bundler module resolution), `require()` works at build time but is not guaranteed at runtime in all environments. More critically, `require()` is synchronous and blocks the event loop. Since `PROMPTS` and `FREE_PROMPT_COUNT` are static data, a dynamic `import()` (already used elsewhere in this file) is the correct pattern and tree-shakes properly.

**Fix:**

```typescript
useEffect(() => {
  if (!isSessionHydrated || !activePrompt || authStatus !== "authenticated") return

  const checkTierGuard = async () => {
    const userTier = (authSession?.user as { tier?: string } | undefined)?.tier ?? "FREE"
    if (userTier !== "FREE") return

    const { PROMPTS, FREE_PROMPT_COUNT } = await import("@/lib/prompts")
    const freePromptIds = PROMPTS.slice(0, FREE_PROMPT_COUNT).map((p) => p.id)
    if (!freePromptIds.includes(activePrompt.id)) {
      router.replace("/")
    }
  }

  checkTierGuard()
}, [activePrompt, authSession, authStatus, isSessionHydrated, router])
```

---

### WR-05: `applyRecoveredSession` unconditionally fires "Recovered local draft" toast

**File:** `src/app/session/[id]/page.tsx:181-183`

**Issue:** `setShowToast(true)` is called unconditionally at the end of `applyRecoveredSession`, including for brand-new sessions with no data to recover. New users will see "Recovered local draft." on their first visit to a session, which is misleading and erodes trust in the UI.

**Fix:** Gate the toast on the same condition as `showResumeToast`, or remove it and rely solely on `showResumeToast` which is already guarded:

```typescript
// Only show recovery toast if there was actually something to recover
if (
  mergedHintsUsed > 0 ||
  mergedScoresUsed > 0 ||
  restoredGraph ||
  restoredHints.length > 0 ||
  restoredNotes.length > 0 ||
  mergedHistory.length > 0
) {
  setShowToast(true)
  setTimeout(() => setShowToast(false), 3000)
}
```

---

## Info

### IN-01: `hasGraphChanged` uses position-sensitive index comparison — order changes are invisible

**File:** `src/lib/graph-parser.ts:283-284`

**Issue:** The diff compares `prev.nodes[i]` with `next.nodes[i]` by array index. If tldraw internally reorders records in its store without adding or removing shapes (e.g., after an undo/redo operation that preserves shape count but reorders the store's internal record list), `hasGraphChanged` returns `false` and the AI does not receive the updated graph. The current implementation is fast and likely correct for the common case, but the edge case is worth noting.

**Suggestion:** If false-negatives become a user-reported problem, consider using a Set-based or Map-based comparison keyed on `node.id`.

---

### IN-02: `PREMIUM` tier silently falls back to `pro` limits in daily-limits

**File:** `src/lib/daily-limits.ts:8`, `src/lib/daily-limits.ts:46`

**Issue:** `const tierKey = tier === "PREMIUM" ? "pro" : tier.toLowerCase()` maps `PREMIUM` to the `pro` key in `LIMITS`. If a `premium` key is added to `LIMITS` in the future (e.g., for different premium daily caps), this mapping will silently keep using `pro` limits for premium users. There is no TypeScript error because the cast broadens the type.

**Suggestion:** Add a comment documenting the intentional fallback, or use a helper function that explicitly maps all three tiers:

```typescript
function toTierKey(tier: "FREE" | "PRO" | "PREMIUM"): "free" | "pro" {
  // PREMIUM intentionally uses pro limits until a separate premium tier is defined
  return tier === "FREE" ? "free" : "pro"
}
```

---

### IN-03: `console.log` policy — `console.error` without bracket prefix in `session/[id]/page.tsx`

**File:** `src/app/session/[id]/page.tsx:254`

**Issue:** `console.error("Session start failed:", err)` is missing the bracket-prefix convention documented in CLAUDE.md (e.g., `[session]`). This makes log filtering harder in production. All other `console.error` calls in the API routes use bracket prefixes.

**Suggestion:**
```typescript
console.error("[session] start failed:", err)
```

---

_Reviewed: 2026-04-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
