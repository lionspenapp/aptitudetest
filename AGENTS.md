# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Lion's Pen Aptitude Assessment — a Next.js 16 (App Router) + Supabase + Tailwind CSS application for nationally-normed adaptive cognitive testing (Grades 3–8). See `README.md` for the full tech stack table and project structure.

### Running the dev server

```bash
npm run dev          # starts on http://localhost:3000
```

The app starts without a live Supabase connection (placeholder env vars in `.env.local`). Pages render; Supabase queries will fail until real credentials are supplied.

### Lint / Build / Test

```bash
npm run lint         # ESLint
npm run build        # production build (also type-checks)
```

No test framework is configured yet. When one is added, document the command here.

### Supabase migrations

Migration SQL lives in `supabase/migrations/`. Apply with the Supabase CLI (`supabase db push`) or paste into the Supabase SQL editor.

### Environment variables

Copy `.env.local.example` → `.env.local` and fill in Supabase credentials. `ANTHROPIC_API_KEY` is optional (enables narrative report generation via `/api/generate-report`).

### Key caveats

- The Supabase client files (`src/lib/supabase-client.ts`, `src/lib/supabase-server.ts`) reference `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at runtime. The app will start but Supabase calls will throw if these are placeholders.
- Zustand store (`src/store/assessment-store.ts`) holds session state in memory — no persistence yet.
- `src/app/api/generate-report/route.ts` is a server-side API route. Never expose `ANTHROPIC_API_KEY` to the client.
