# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

InScribe (The Academic Mastery OS) — a Next.js 16 (App Router) + Supabase + Tailwind CSS application for cognitive-science-driven study protocols (Grades 3–8+ curriculum mapping via AP/IB/NGSS). See `README.md` for the full tech stack and app flow.

### Running the dev server

```bash
npm run dev # starts on http://localhost:3000
```

Supabase credentials are available as environment secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Ensure `.env.local` contains them before starting — the dev server reads env vars from that file at startup.

### Lint / Build / Test

```bash
npm run lint # ESLint
npm run build # production build (also type-checks)
```

No test framework is configured yet. When one is added, document the command here.

### Supabase migrations

Migration SQL lives in `supabase/migrations/`. Apply with the Supabase CLI (`supabase db push`) or paste into the Supabase SQL editor. Run migrations 003–005 for InScribe (schema, curriculum seed, legacy Lion's Pen cleanup).

### Environment variables

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are injected as environment secrets. On startup, write them into `.env.local` so Next.js can read them. `ANTHROPIC_API_KEY` is optional (enables AI material generation, evaluation, and hints — mock data used when absent). Stripe keys optional for Premium billing. See `.env.local.example`.

Set `NEXT_PUBLIC_INSCRIBE_DEV_TIMERS=true` to use shortened timer durations (10s blocks) during development.

### Key caveats

- The Supabase client files reference env vars at runtime. The app will start but Supabase calls will throw if these are placeholders.
- Zustand store (`src/store/inscribe-store.ts`) holds session state in memory — persistence is via Supabase DB.
- AI API routes (`/api/create-session`, `/api/evaluate-dump`, `/api/stuck-hint`) are server-side only. Never expose API keys to the client.
- Supabase Edge Functions in `supabase/functions/` are excluded from TypeScript build — primary AI logic lives in Next.js API routes (`src/lib/llm.ts`).
- If `.env.local` does not exist, copy it from `.env.local.example` before starting the dev server.
