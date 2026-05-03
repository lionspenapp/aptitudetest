# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Lion's Pen Aptitude Assessment — a Next.js 16 (App Router) + Supabase + Tailwind CSS application for nationally-normed adaptive cognitive testing (Grades 3–8). See `README.md` for the full tech stack table and project structure.

### Running the dev server

```bash
npm run dev          # starts on http://localhost:3000
```

Supabase credentials are available as environment secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Ensure `.env.local` contains them before starting — the dev server reads env vars from that file at startup.

### Lint / Build / Test

```bash
npm run lint         # ESLint
npm run build        # production build (also type-checks)
```

No test framework is configured yet. When one is added, document the command here.

### Supabase migrations

Migration SQL lives in `supabase/migrations/`. Apply with the Supabase CLI (`supabase db push`) or paste into the Supabase SQL editor.

### Environment variables

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are injected as environment secrets. On startup, write them into `.env.local` so Next.js can read them (the update script does not do this — do it in your session before running `npm run dev`). `ANTHROPIC_API_KEY` is optional (enables narrative report generation via `/api/generate-report`). See `.env.local.example` for the template.

### Key caveats

- The Supabase client files (`src/lib/supabase-client.ts`, `src/lib/supabase-server.ts`) reference `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at runtime. The app will start but Supabase calls will throw if these are placeholders.
- Zustand store (`src/store/assessment-store.ts`) holds session state in memory — no persistence yet.
- `src/app/api/generate-report/route.ts` is a server-side API route. Never expose `ANTHROPIC_API_KEY` to the client.
- If `.env.local` does not exist, copy it from `.env.local.example` before starting the dev server.
