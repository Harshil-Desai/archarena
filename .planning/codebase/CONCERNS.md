# Codebase Concerns

**Analysis Date:** 2026-04-15

## Tech Debt

**Dual time-tracking logic fragmentation:**
- Issue: Limits are tracked in two places with different semantics — `InterviewSession.hintsUsed/scoresUsed` (per-session) and `User.dailyHintsUsed/dailyScoresUsed` (24-hour rolling window). The daily reset logic compares `hoursSinceReset >= 24` using timestamps, which is susceptible to timezone ambiguity and drift.
- Files: `src/lib/daily-limits.ts`, `src/lib/limits.ts`, `src/app/api/ai/hint/route.ts:74-88`, `src/app/api/ai/score/route.ts:77-92`
- Impact: Tokens can be miscounted if server clock drifts, and the "24 hours" reset is relative to `dailyLimitResetAt` — not midnight UTC. A user could game the system by creating sessions at different times.
- Fix approach: Consolidate to UTC-based midnight resets (e.g., reset at `today 00:00 UTC`, not `24 hours ago`). Add a migration to align existing users to calendar days.

**GraphQL/JSON type casting with `as unknown as Prisma.InputJsonValue`:**
- Issue: `chatHistory` is cast to `Prisma.InputJsonValue` without validation in `src/app/api/session/[id]/chat/route.ts:134`. If the `ChatMessage[]` type changes (e.g., new required fields), stale data persists in the DB.
- Files: `src/app/api/session/[id]/chat/route.ts:134`
- Impact: Incompatible message structures in DB can crash the deserializer or produce silent data loss.
- Fix approach: Add a runtime schema validator (e.g., `zod`) to validate `chatHistory` before saving. Validate on load in `SessionPage`.

**AI model hardcoding instead of environment-driven:**
- Issue: Model names and Gemini variants are hardcoded in `src/lib/ai.ts:69-83`. The code shows `gemini-2.5-flash` used for both hints AND scoring (line 82), which violates CLAUDE.md's requirement that scoring use a stronger model.
- Files: `src/lib/ai.ts:69-83`, `src/app/api/ai/score/route.ts:118`
- Impact: Hint latency is unnecessarily high if using a stronger model; scoring accuracy is degraded if using a weaker one. Cannot A/B test models without code changes.
- Fix approach: Move model selection to environment config (`ANTHROPIC_HINT_MODEL`, `ANTHROPIC_SCORE_MODEL`, etc.). Validate models on startup.

**Unvalidated webhook variant mapping:**
- Issue: `getTierFromVariantId()` in `src/app/api/billing/webhook/route.ts:50-64` defaults to `"PRO"` if the variant ID is unknown, with only a `console.warn()`. An attacker or LemonSqueezy bug could upgrade a Free user to Pro silently.
- Files: `src/app/api/billing/webhook/route.ts:50-64`
- Impact: Security: Tier can be incorrectly escalated. Revenue leak if webhook is replayed or variant IDs are misconfigured.
- Fix approach: Throw an error and reject the webhook if variant ID is unknown. Add a validation step that checks variant IDs against a known allowlist. Log all tier changes to an audit table.

**Score JSON parsing without truncation detection:**
- Issue: `src/app/api/ai/score/route.ts:168-184` checks `endsWith("}")` to detect truncation, but does not validate that the JSON is complete (missing closing brackets for nested objects). A truncated response like `{"score": 45, "breakdown": {"scalability": 10` would fail silently and not save.
- Files: `src/app/api/ai/score/route.ts:168-184`
- Impact: If streaming is interrupted, the score is never persisted. User sees blank score panel. No error notification.
- Fix approach: Add JSON schema validation and explicit error logging. Return a specific error to the client if JSON is malformed.

## Known Bugs

**Daily limit reset window is offset-dependent:**
- Symptoms: A user who requests a hint at 23:55 UTC will hit their daily limit again 24 minutes later (at 00:19 next day), not at 00:00.
- Files: `src/lib/daily-limits.ts:21-22`
- Trigger: Refresh the page repeatedly across midnight UTC.
- Workaround: Manually reset `dailyLimitResetAt` in the DB for affected users.

**IndexedDB errors are silently swallowed:**
- Symptoms: Canvas or chat history fails to persist locally without user notification.
- Files: `src/lib/indexeddb.ts:52, 82, 106, 147, 170` — all `console.warn()` with no throw.
- Trigger: Browser quota exceeded, IndexedDB disabled, or private browsing mode.
- Workaround: None — fallback to server state, which can become stale if network fails.

**ChatPanel hint limit check uses stale local state:**
- Symptoms: User sees "Free plan is out of hints" but the button remains clickable. Clicking again returns `daily_limit_reached` (not `free_limit_reached`).
- Files: `src/components/chat/ChatPanel.tsx:53`
- Trigger: Switch between browser tabs while hint request is in flight.
- Workaround: Refresh the page to sync state from server.

## Security Considerations

**Webhook secret missing at runtime returns 500, not 503:**
- Risk: If `LEMONSQUEEZY_WEBHOOK_SECRET` is missing, the endpoint returns 500 instead of 503 (Service Unavailable). External monitoring or LemonSqueezy retry logic may misinterpret this as a persistent bug and stop retrying.
- Files: `src/app/api/billing/webhook/route.ts:71-79`
- Current mitigation: `process.env` will fail at startup if not set (during Next.js build).
- Recommendations: Return 503 instead of 500. Add a pre-flight check in the app layout or middleware to verify all critical env vars are set.

**Variant ID lookup is case-sensitive and type-coercive:**
- Risk: `getTierFromVariantId()` compares against `process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID` (public, visible in client bundle), but the variant ID from the webhook is cast to `String()` without trimming. Whitespace or encoding mismatches would silently default to Pro.
- Files: `src/app/api/billing/webhook/route.ts:50-64`
- Current mitigation: LemonSqueezy controls the webhook payload format.
- Recommendations: Trim and normalize IDs. Use a `Map<string, Tier>` instead of if-else chain. Log all lookups.

**Session ownership is checked, but not rate-limited:**
- Risk: An attacker can brute-force session IDs (36-char CUIDs, not random) and attempt to read/write canvas state for sessions they don't own.
- Files: `src/app/api/session/[id]/canvas/route.ts:43`, `src/app/api/session/[id]/chat/route.ts:68`
- Current mitigation: Ownership check via DB query prevents data leakage. No enumeration of valid IDs.
- Recommendations: Add rate limiting to `/api/session/[id]/*` routes (max 10 requests per minute per IP). Use a short-lived, opaque session token instead of predictable IDs.

**Chat history persisted without content-length limits:**
- Risk: A user (or attacker with session ID) can send arbitrarily large messages that persist in `InterviewSession.chatHistory`. Over time, the DB row grows unbounded.
- Files: `src/app/api/session/[id]/chat/route.ts:159`
- Current mitigation: `truncateHistoryForAI()` limits AI context to 6 messages × 300 chars = 1.8 KB, but actual persisted history is unlimited.
- Recommendations: Add a hard limit (e.g., max 50 messages or 100 KB per session). Truncate old messages on save.

## Performance Bottlenecks

**Graph diff serialized with JSON.stringify on every tldraw store event:**
- Problem: `hasGraphChanged()` in `src/lib/graph-parser.ts:280` serializes both prev and next graphs to JSON, then compares strings. tldraw fires hundreds of events per second during drawing.
- Files: `src/lib/graph-parser.ts:275-281`
- Cause: JSON.stringify is O(n) and re-encodes identical nested objects on every pixel movement.
- Improvement path: Replace with shallow equality check on node/edge counts and IDs. Only deep-serialize on actual changes (e.g., when node added, not when resized).

**Canvas state persisted on every graph change:**
- Problem: The `lastSentGraph` is compared, and if changed, the full `canvasState` is sent to `PATCH /api/session/[id]/canvas`. This happens dozens of times per second during active drawing.
- Files: `src/app/session/[id]/page.tsx` (implied via InterviewCanvas)
- Cause: Client emits canvas updates on every pixel movement.
- Improvement path: Debounce canvas saves to 2-5 seconds. Use a secondary IndexedDB save path for faster local recovery (already implemented, but primary path is expensive).

**AI truncation applied per-call, not cached:**
- Problem: `truncateGraphForAI()` and `truncateHistoryForAI()` are called on every hint/score/chat request. If the graph has 200 nodes, we slice and map 200+ times per request.
- Files: `src/lib/ai.ts:18-50`, `src/app/api/ai/hint/route.ts:21-22`
- Cause: No memoization or server-side cache of truncated graphs.
- Improvement path: Cache truncated graph on `InterviewSession` or use Redis. TTL 60 seconds.

**Webhook processing is synchronous and blocking:**
- Problem: The webhook handler awaits DB updates sequentially in a switch statement. If LemonSqueezy sends 1000 webhooks, each one blocks until the previous finishes.
- Files: `src/app/api/billing/webhook/route.ts:121-194`
- Cause: Single-threaded Node.js + Prisma queries.
- Improvement path: Queue webhooks to a job processor (e.g., Bull) or async event bus. Return 202 Accepted immediately.

## Fragile Areas

**Session state sync between client Zustand and DB:**
- Files: `src/store/session.ts`, `src/app/session/[id]/page.tsx`, `src/app/api/session/start/route.ts`
- Why fragile: Zustand holds local copies of `hintsUsed`, `scoresUsed`, `chatHistory`, `canvasState`, and `scoreResult`. These must stay in sync with DB. If a request fails mid-flight, the client state can diverge from server.
  - Example: Hint request succeeds but network error prevents reading `hintsUsed` from response → client shows 5 hints used, DB shows 6.
- Safe modification: After every API call that modifies limits or state, explicitly call `syncFromServer()` or `syncHintsFromServer()`. Never trust client state for enforcement.
- Test coverage: Missing integration tests for sync failures. No test for offline scenarios.

**LemonSqueezy webhook idempotency:**
- Files: `src/app/api/billing/webhook/route.ts`
- Why fragile: The webhook handler updates the user tier immediately without checking if the event was already processed. If LemonSqueezy retries a `subscription_created` event, the tier is re-set (idempotent by accident, but not by design).
- Safe modification: Add an `Event` table with `id`, `lemonSqueezyEventId`, `processedAt`. Check if `lemonSqueezyEventId` exists before processing. Ignore duplicates.
- Test coverage: No test for webhook replay attacks.

**Graph parser annotation attachment distance (240px):**
- Files: `src/lib/graph-parser.ts:27, 119`
- Why fragile: The hardcoded `ANNOTATION_ASSOCIATION_DISTANCE = 240` assumes a specific canvas zoom level and screen size. On mobile or zoomed-in views, annotations attach to wrong nodes.
- Safe modification: Make the distance configurable per session. Base it on canvas viewport size, not a magic number.
- Test coverage: No tests for annotation parsing with different zoom levels.

**tldraw store record type guards assume shape.props structure:**
- Files: `src/lib/graph-parser.ts:29-39`
- Why fragile: `hasShapeMeta()` assumes `shape.props.meta` exists and is an object. If tldraw's shape structure changes (e.g., `meta` moves to `shape.metadata`), all parsing breaks silently.
- Safe modification: Add explicit type assertions and throw descriptive errors if expected props are missing. Add schema validation using Zod or TypeScript type guards.
- Test coverage: No unit tests for graph parser. No tests for malformed tldraw records.

## Scaling Limits

**Daily limit reset is per-user, not cached:**
- Current capacity: 1 DB query per hint/score request to check `dailyHintsUsed` and reset if needed.
- Limit: At 1000 concurrent users, this is 1000+ DB queries/second during peak hours.
- Scaling path: Use Redis to track daily limits per user. TTL each key at midnight UTC. Sync back to DB once per day.

**Session state is not sharded — all in one Postgres instance:**
- Current capacity: Supabase's Postgres can handle ~10K concurrent connections.
- Limit: At 500 concurrent active sessions, each polling canvas state, this is 500+ queries/second.
- Scaling path: Add read replicas. Use connection pooling (PgBouncer). Cache session state in Redis with TTL.

**ChatHistory JSON column grows unbounded:**
- Current capacity: Supabase's max row size is ~1 GB, but rows >100 MB are slow to query.
- Limit: A heavy user with 100 messages × 10 KB each = 1 MB per session. 1000 sessions = 1 GB.
- Scaling path: Migrate `chatHistory` to a separate `Message` table with foreign keys. Index by session ID and timestamp.

## Dependencies at Risk

**Gemini API is primary fallback but uses flash model for scoring:**
- Risk: `src/lib/ai.ts:82` shows Gemini using `gemini-2.5-flash` for both hints and scoring. This contradicts CLAUDE.md, which says scoring should use a stronger model. If Gemini is the fallback, scoring quality degrades.
- Impact: Inconsistent scores between Anthropic (Claude Sonnet) and Gemini (Flash). Users may exploit by switching providers.
- Migration plan: Revert Gemini scoring to `gemini-2.5-pro` or implement provider selection at the prompt level. Add a/b testing to measure score consistency.

**NextAuth v5 is in beta:**
- Risk: `src/auth.ts` uses `NextAuth()` from a beta version. Breaking changes may occur in final release. Session format or adapter behavior could change.
- Impact: If NextAuth releases a final version with breaking changes, session deserialization fails and all users are logged out.
- Migration plan: Monitor NextAuth releases. Add pre-deployment tests that verify session creation and verification still work. Pin version to `^5.x.x` until stable.

**tldraw v2 custom shapes may conflict with future updates:**
- Risk: Custom shape definitions in `src/components/canvas/shapes/` are deeply integrated with tldraw's shape prop system. An update to tldraw could break the `ShapeMeta` structure.
- Impact: Canvas stops rendering vendor shapes. All unsaved designs are lost.
- Migration plan: Abstract custom shapes into a versioned serialization layer. Add integration tests that verify shapes render after tldraw updates.

## Missing Critical Features

**No retry logic for failed AI requests:**
- Problem: If Anthropic/Gemini API returns 429 or 5xx, the request fails immediately. User must manually click "Ask hint" again.
- Blocks: Users with poor internet or during provider outages cannot use AI features.
- Solution: Add exponential backoff (3 retries, max 30 seconds). Store failed requests in IndexedDB. Resume on next session.

**No audit trail for limit enforcement:**
- Problem: If a user claims they were over-charged or incorrectly limited, there's no way to verify the decision was made correctly.
- Blocks: Billing disputes cannot be resolved with data.
- Solution: Add an `AuditLog` table that records every limit check, tier change, and AI request. Persist to immutable storage (e.g., S3).

**No webhook replay detection:**
- Problem: LemonSqueezy webhooks are not idempotent. A network retry or replayed webhook can upgrade a user multiple times.
- Blocks: Revenue integrity cannot be guaranteed.
- Solution: Add `webhookEventId` to `User` model. Deduplicate on this ID in the webhook handler.

## Test Coverage Gaps

**No unit tests for daily limit reset logic:**
- What's not tested: The 24-hour window calculation, reset on threshold, and interaction between session and daily limits.
- Files: `src/lib/daily-limits.ts`
- Risk: Bugs in reset logic are only caught after users report them (e.g., "I had hints left yesterday but now they're gone").
- Priority: High

**No integration tests for AI streaming routes:**
- What's not tested: Score streaming, error handling mid-stream, partial JSON truncation detection.
- Files: `src/app/api/ai/score/route.ts`
- Risk: A bug in stream handling (e.g., chunk encoding) is not caught. Users see blank or corrupted scores.
- Priority: High

**No e2e tests for billing flow:**
- What's not tested: Checkout → webhook → tier upgrade → feature unlock. Refund flow. Expired subscription downgrade.
- Files: `src/app/billing/*`, `src/app/api/billing/*`
- Risk: Users purchase but don't receive access. Refunds are not processed. Revenue is lost.
- Priority: Critical

**No tests for graph parser with malformed tldraw records:**
- What's not tested: Missing shape props, invalid meta, broken arrows, circular dependencies.
- Files: `src/lib/graph-parser.ts`
- Risk: A user with a corrupted canvas snapshot cannot load their session. No recovery path.
- Priority: Medium

**No load tests for concurrent session saves:**
- What's not tested: 100+ concurrent `PATCH /api/session/[id]/canvas` requests.
- Files: `src/app/api/session/[id]/canvas/route.ts`
- Risk: DB connection pool exhaustion during peak usage (e.g., live class session).
- Priority: Medium

---

*Concerns audit: 2026-04-15*
