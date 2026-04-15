---
phase: 01-stability-performance
plan: 02
subsystem: performance, ai-cost
tags: [dynamic-import, token-budget, model-routing, tldraw]
dependency_graph:
  requires: [01-01]
  provides: [dynamic-tldraw-import, truncateToTokenBudget]
  affects: [session-page-load, ai-cost-controls]
tech_stack:
  added: [next/dynamic]
  patterns: [lazy-loading, token-budget-heuristic]
key_files:
  created: []
  modified:
    - src/app/session/[id]/page.tsx
    - src/lib/ai.ts
decisions:
  - Used 4 chars/token heuristic for truncateToTokenBudget (standard English approximation)
  - No changes needed to hint/score routes - already correctly implemented
metrics:
  duration: ~1 min
  completed: 2026-04-15
---

# Phase 01 Plan 02: Page Load and AI Cost Controls Summary

Dynamic import of tldraw via next/dynamic with loading skeleton, plus truncateToTokenBudget utility (200-token cap, 4 chars/token heuristic) for future voice transcripts.

## What Was Done

### Task 1: Dynamic import tldraw and add token budget utility
- Replaced static `import { InterviewCanvas }` with `next/dynamic` import (ssr: false)
- Added loading skeleton placeholder while tldraw ~500KB bundle loads
- Added `truncateToTokenBudget()` export to `src/lib/ai.ts` using `LIMITS_AI.MAX_VOICE_TOKENS` (200)

### Task 2: Verify AI model routing in hint and score routes
- **Hint route**: Confirmed uses `MODEL_MAP.haiku` (Anthropic) and `GEMINI_MODEL_MAP.flash` (Gemini)
- **Score route**: Confirmed uses `MODEL_MAP.sonnet` (Anthropic) and `GEMINI_MODEL_MAP.pro` (Gemini)
- Both routes call `truncateGraphForAI()` and `truncateHistoryForAI()` on inputs
- Neither route reads `hintsUsed`/`scoresUsed` from request body (DB is source of truth)
- Both routes check auth via `await auth()` as first operation
- No fixes needed - all routes correctly implemented

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | c54d7b9 | feat(01-02): dynamic import tldraw and add token budget utility |
| 2 | (none) | Verification only - no changes needed |
