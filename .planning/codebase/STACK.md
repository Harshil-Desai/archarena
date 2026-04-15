# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- TypeScript 5.9.3 - Strict mode (tsconfig.json: `strict: true`)
- JavaScript (React JSX)

**Secondary:**
- SQL (PostgreSQL dialect via Prisma)

## Runtime

**Environment:**
- Node.js (no specific version pinned; infer from `.nvmrc` if present)

**Package Manager:**
- npm (no lock file versioning detected in package.json)
- Lockfile: `package-lock.json` (implicit)

## Frameworks

**Core:**
- Next.js 16.2.1 - Full-stack React framework with App Router
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering

**Authentication:**
- next-auth 5.0.0-beta.30 - OpenID Connect providers (Google, GitHub OAuth)
- @auth/prisma-adapter 2.11.1 - PrismaAdapter for NextAuth session/account storage

**State Management:**
- Zustand 5.0.12 - Client-side session state (canvas, hints, scores, chat)

**Canvas & Diagramming:**
- @tldraw/editor 4.5.3 - Canvas library core
- @tldraw/tldraw 4.5.3 - Pre-built UI and vendor shapes

**Real-time Communication:**
- socket.io 4.8.3 - WebSocket server
- socket.io-client 4.8.3 - WebSocket client

**Testing:**
- No test framework detected in dependencies (Jest or Vitest not installed)

**Build/Dev:**
- TypeScript 5.9.3 - Type checking and compilation
- ESLint 9 - Linting
- eslint-config-next 16.2.1 - Next.js ESLint rules

## Key Dependencies

**Critical:**
- @anthropic-ai/sdk 0.80.0 - Claude API for hints, chat, scoring
- @google/generative-ai 0.24.1 - Google Gemini API (secondary AI model)
- @prisma/client 7.6.0 - Database ORM
- @prisma/adapter-pg 7.6.0 - PostgreSQL adapter for Prisma
- @prisma/extension-accelerate 3.0.1 - Query caching/acceleration (Supabase)

**Infrastructure:**
- @lemonsqueezy/lemonsqueezy.js 4.0.0 - Payment/subscription SDK
- pg 8.20.0 - PostgreSQL client (low-level)
- prisma 7.6.0 - Database toolkit and CLI

**UI & Styling:**
- Tailwind CSS 4.2.2 - Utility-first CSS framework
- @tailwindcss/postcss 4.2.2 - PostCSS plugin for Tailwind
- lucide-react 1.7.0 - Icon library

**Utilities:**
- nanoid 5.1.7 - URL-friendly unique IDs
- ai 6.0.138 - Vercel AI SDK (streaming helpers, potential)
- dotenv 17.4.1 - Environment variable loader

## Configuration

**Environment:**
- .env.local (local development)
- .env.example (template)
- Environment variables configured as per CLAUDE.md: ANTHROPIC_API_KEY, DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET, LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_WEBHOOK_SECRET, NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID, NEXT_PUBLIC_LEMONSQUEEZY_PREMIUM_VARIANT_ID

**Build:**
- `next.config.ts` - Minimal Next.js configuration (no special overrides)
- `tsconfig.json` - TypeScript strict mode with ES2017 target, bundler module resolution
- `postcss.config.mjs` - PostCSS with Tailwind CSS plugin
- `eslint.config.mjs` - ESLint configuration (ESLint 9+)

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- npm CLI
- PostgreSQL connection (Supabase or local)
- Environment variables: ANTHROPIC_API_KEY, GOOGLE_GEMINI_API_KEY, DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

**Production:**
- Node.js 18+ (Next.js 16 requirement)
- PostgreSQL database (Supabase)
- Anthropic API key and quota
- Google Gemini API key (optional fallback)
- LemonSqueezy account and credentials
- NextAuth secret for session encryption

---

*Stack analysis: 2026-04-15*
