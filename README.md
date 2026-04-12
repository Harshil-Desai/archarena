# SysDraw

> Practice system design interviews on a live whiteboard 
> with an AI interviewer that watches you draw.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![tldraw](https://img.shields.io/badge/tldraw-v2-black?style=flat-square)
![Anthropic Claude](https://img.shields.io/badge/Anthropic-Claude-D97757?style=flat-square&logo=anthropic)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![LemonSqueezy](https://img.shields.io/badge/LemonSqueezy-Payments-FFC233?style=flat-square)

---

## What is this?

SysDraw is a browser-based system design interview practice tool. You pick a question, draw your architecture using vendor-specific components — PostgreSQL, Redis, Kafka — on a real whiteboard canvas, and an AI interviewer watches your diagram in real-time and asks follow-up questions. Label your components, defend your tradeoffs, then request a final score out of 100 with a breakdown across scalability, reliability, tradeoffs, and completeness. No design gets 100 — the scoring reflects real interview standards.

---

## Tech Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| Frontend | Next.js 14 (App Router) | Server components + streaming |
| Language | TypeScript | Strict typing across the stack |
| Canvas | tldraw v2 | Production-quality whiteboard, extensible shape API |
| Styling | Tailwind CSS | Utility-first, consistent dark theme |
| State | Zustand | Lightweight session state, no prop drilling |
| Auth | NextAuth v5 + Prisma | Google + GitHub OAuth, database sessions |
| Database | PostgreSQL (Supabase) | User accounts, session persistence, limit enforcement |
| ORM | Prisma | Type-safe DB access, migrations |
| AI (hints) | Claude Haiku / Gemini Flash | Fast model for real-time follow-up questions |
| AI (scoring) | Claude Sonnet / Gemini Pro | Strong model for detailed architecture evaluation |
| Payments | LemonSqueezy | Merchant of record, handles tax compliance |
| Real-time | Socket.io | Canvas delta sync (Pro tier) |
| Deployment | Vercel + Supabase | Edge functions + managed Postgres |

---

## Architecture Overview

```text
Browser
  tldraw canvas
    → parseCanvasToGraph() [client]
    → debounce 1.5s + diff check
    → SemanticGraph (nodes + edges + annotations)
  
  Two flows from SemanticGraph:

  Flow A (hints — on demand):
    POST /api/ai/hint
      → auth check + DB limit read
      → buildHintPrompt(graph, history)
      → Claude Haiku / Gemini Flash
      → hint text streamed back
      → DB: hintsUsed incremented

  Flow B (scoring — explicit):
    POST /api/ai/score
      → auth check + DB limit read  
      → buildScoringPrompt(graph, history)
      → Claude Sonnet / Gemini Pro
      → JSON streamed back
      → DB: scoreResult + scoresUsed saved

  Canvas autosave:
    PATCH /api/session/[id]/canvas
      → DB: canvasState updated

Database (Supabase Postgres via Prisma):
  User — id, email, tier, billing fields
  InterviewSession — canvasState, chatHistory, 
                     scoreResult, hintsUsed, scoresUsed
  @@unique([userId, promptId]) — one session per question
```

---

## Key Design Decisions

1. **Why SemanticGraph instead of raw tldraw JSON**  
   tldraw stores state as geometric records with coordinates. Sending this to an LLM wastes tokens and produces poor reasoning. The graph parser extracts vendor, category, label, and edges into a structured format the model can reason about.

2. **Why two AI models**  
   Hints need to be fast and cheap — triggered frequently. Scores need to be accurate and thorough — triggered once. Routing by use case keeps costs low without sacrificing quality where it matters.

3. **Why client-side diff before emitting**  
   tldraw fires hundreds of store events per second during active drawing. The diff check in `hasGraphChanged()` prevents redundant API calls by only emitting when the semantic graph actually changes.

4. **Why LemonSqueezy over Stripe**  
   LemonSqueezy acts as the Merchant of Record and handles VAT and sales tax automatically. For a solo-built SaaS, eliminating tax compliance overhead is worth the reduced flexibility.

5. **Why `@@unique([userId, promptId])` is the core of limit enforcement**  
   Storing `hintsUsed` in the database and keying it to `userId + promptId` means refreshing the browser, clearing localStorage, or opening a new tab cannot reset limits. The constraint also ensures one session per question per user.

6. **Why IndexedDB as fallback**  
   Free tier sessions are primarily persisted in Postgres. IndexedDB acts as a local fallback if the autosave API fails, preventing data loss during network issues.

---

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- Google OAuth app (Google Cloud Console)
- GitHub OAuth app (GitHub Developer Settings)
- Anthropic API key OR Google AI Studio key

### Steps

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/sysdraw
   cd sysdraw
   npm install
   ```

2. **Environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in all values — see `.env.example` for required keys.

3. **Database setup**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Run dev server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

### OAuth callback URLs to register

**Google (console.cloud.google.com):**  
`http://localhost:3000/api/auth/callback/google`

**GitHub (github.com/settings/developers):**  
`http://localhost:3000/api/auth/callback/github`

### LemonSqueezy webhook (local testing)
1. Run `ngrok http 3000`
2. Register `https://[ngrok-id].ngrok.io/api/billing/webhook` in the LemonSqueezy dashboard.

---

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── ai/hint/        # Hint generation — Claude Haiku / Gemini Flash
│   │   ├── ai/score/       # Architecture scoring — Claude Sonnet / Gemini Pro
│   │   ├── auth/           # NextAuth route handler
│   │   ├── billing/        # LemonSqueezy checkout + webhook
│   │   └── session/        # Session CRUD — start, canvas save, chat save
│   ├── billing/            # Pricing and upgrade page
│   ├── login/              # OAuth sign-in page
│   └── session/[id]/       # Main interview session page
├── components/
│   ├── auth/               # UserMenu — avatar, tier badge, sign out
│   ├── canvas/             # tldraw wrapper, vendor shapes, toolbar, validation
│   ├── chat/               # AI interviewer panel, hint button, message list
│   ├── prompt/             # Prompt selector (landing) and badge (session)
│   ├── score/              # Score display — breakdown bars, missed concepts
│   └── session/            # Timer, export button, usage pill
├── lib/
│   ├── ai.ts               # Prompt builders, model routing, createScoringStream
│   ├── graph-parser.ts     # tldraw records → SemanticGraph
│   ├── indexeddb.ts        # Local session fallback storage
│   ├── lemonsqueezy.ts     # LemonSqueezy client init
│   ├── limits.ts           # Tier limit constants
│   ├── prisma.ts           # Prisma singleton
│   ├── prompts.ts          # 15 preset system design questions
│   └── socket-client.ts    # Socket.io client setup
├── store/
│   └── session.ts          # Zustand — session state, sync actions
└── types/
    ├── index.ts             # SemanticGraph, ScoreResult, ChatMessage etc.
    └── next-auth.d.ts       # Session type extensions
```

---

## Roadmap

| Status | Item |
| :--- | :--- |
| ✅ | Core whiteboard with vendor-specific shapes |
| ✅ | AI hints + scoring with multi-model routing |
| ✅ | Auth (Google + GitHub OAuth) |
| ✅ | Session persistence (resume after refresh) |
| ✅ | Payments + tier gating (Free / Pro / Premium) |
| 🔄 | Frontend tier gating (Pro features in UI) |
| 🔄 | Production deployment |
| ⬜ | Session history page (Pro) |
| ⬜ | PNG export (Pro) |
| ⬜ | Custom prompts (Premium) |
| ⬜ | Custom AI persona (Premium) |
| ⬜ | Collaborative sessions |

---

## License

MIT License

Copyright (c) 2026 SysDraw

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
