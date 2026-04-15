---
phase: 01-stability-performance
fixed_at: 2026-04-15T00:00:00Z
review_path: .planning/phases/01-stability-performance/01-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
files_modified:
  - src/lib/daily-limits.ts
  - src/lib/ai.ts
  - src/app/session/[id]/page.tsx
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-04-15
**Source review:** .planning/phases/01-stability-performance/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Daily limit reset and increment are not in a transaction

**Files modified:** `src/lib/daily-limits.ts`
**Commit:** 5837d58
**Applied fix:** Wrapped the reset `updateMany` and the check+increment `updateMany` in `prisma.$transaction()` for both `checkAndIncrementDailyHints` and `checkAndIncrementDailyScores`, eliminating the TOCTOU window between the two operations.

### CR-02: Score button enforces `LIMITS.free.scoresPerSession` for all tiers

**Files modified:** `src/app/session/[id]/page.tsx`
**Commit:** 8f3c137
**Applied fix:** Removed the `if (scoresUsed >= LIMITS.free.scoresPerSession) return` guard from `handleScoreClick`. Server enforces per-tier limits authoritatively; added a comment explaining why the client gate was removed.

### WR-01: `anthropicClient` instantiated at module load

**Files modified:** `src/lib/ai.ts`
**Commit:** fe2366c
**Applied fix:** Replaced the top-level `const anthropicClient = new Anthropic()` with a lazy `getAnthropicClient()` function (mirrors the existing Gemini pattern). All three call sites (`generateAnthropicHint`, `generateAnthropicChatReply`, Anthropic scoring stream) updated to use `getAnthropicClient().messages`.

### WR-02: Unsafe cast on `message.content[0]` in Anthropic hint and chat functions

**Files modified:** `src/lib/ai.ts`
**Commit:** fe2366c
**Applied fix:** Replaced both direct casts with a guarded pattern: read `block = message.content[0]`, throw a descriptive error if `!block || block.type !== "text"`, otherwise return `block.text`. Applied to both `generateAnthropicHint` and `generateAnthropicChatReply`.

### WR-03: Gemini scoring uses `maxOutputTokens: 10000`

**Files modified:** `src/lib/ai.ts`
**Commit:** fe2366c
**Applied fix:** Changed `maxOutputTokens: 10000` to `maxOutputTokens: 1500` in `createScoringStream` to align with the documented scoring token budget in CLAUDE.md.

### WR-04: `require()` used inside a `useEffect` in a client component

**Files modified:** `src/app/session/[id]/page.tsx`
**Commit:** 086851f
**Applied fix:** Converted the synchronous `require("@/lib/prompts")` call to an async `await import("@/lib/prompts")` inside an inner `checkTierGuard` async function, consistent with the dynamic import pattern already used elsewhere in the file.

### WR-05: `applyRecoveredSession` unconditionally fires "Recovered local draft" toast

**Files modified:** `src/app/session/[id]/page.tsx`
**Commit:** 086851f
**Applied fix:** Wrapped the `setShowToast(true)` call in the same guard condition already used by `setShowResumeToast` — only fires when at least one of `mergedHintsUsed`, `mergedScoresUsed`, `restoredGraph`, `restoredHints`, `restoredNotes`, or `mergedHistory` has content.

## Technical Notes

- WR-01, WR-02, and WR-03 were committed in a single atomic commit since all three touch `src/lib/ai.ts`.
- WR-04 and WR-05 were committed together since both touch `src/app/session/[id]/page.tsx` and CR-02 was already committed separately for the same file.
- The `p: { id: string }` inline type annotation was added in WR-04's `freePromptIds.map()` call because the dynamic import loses the static type context that `require()` had via the `as { ... }` cast — this preserves strict-mode compliance with no `any`.

---

_Fixed: 2026-04-15_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
