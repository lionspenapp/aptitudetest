# InScribe · The Academic Mastery OS

Premium study engine designed to automate the biophysical conditions required for long-term memory encoding. Takes students from zero-friction setup through spaced learning, un-cued retrieval, traffic-light diagnostics, and exam-day safety shields.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React + TypeScript |
| Styling | Tailwind CSS 4 (parchment/lapis/gold design system) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| State | Zustand |
| AI | Anthropic Claude (material generation, evaluation, hints) |
| Payments | Stripe (Premium subscription) |
| Hosting | Vercel / Netlify |

## Getting Started

```bash
npm install
cp .env.local.example .env.local
# Fill in Supabase credentials (required)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run migrations in `supabase/migrations/` (003–005 for InScribe schema, curriculum seed, and legacy cleanup).
3. Copy project URL and anon key into `.env.local`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build + type-check |
| `npm run lint` | Run ESLint |

## App Flow

```
/ → Landing
/login, /signup → Auth
/setup → Zero-friction config (course, unit, question count, exam format)
/study/[id]/spaced → 20-10-20-10-20 spaced learning timer
/study/[id]/sandbox → Retrieval brain dump + speech + "I'm Stuck"
/study/[id]/diagnostics → Traffic light + 2-pass recovery deck
/study/[id]/exam-shield → Sleep lockout + pre-flight shields
/dashboard → Session history + Premium upgrade
```

## Environment Variables

See `.env.local.example` for all options. Minimum required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional: `ANTHROPIC_API_KEY` (AI features; mock data used when absent), Stripe keys for Premium billing.

## Project Structure

```
src/
├── app/
│   ├── api/                  # create-session, evaluate-dump, stuck-hint, etc.
│   ├── setup/                # Epic 1 config
│   ├── study/[sessionId]/    # Spaced, sandbox, diagnostics, exam-shield
│   └── dashboard/
├── components/               # BrainCooling, TrafficLight, RecoveryDeck, etc.
├── hooks/                    # useSpeechRecognition
├── lib/                      # llm, spaced-timer, exam-schedule, subscription
├── store/inscribe-store.ts   # Zustand session state
└── types/database.ts
supabase/
├── migrations/               # InScribe schema + curriculum seed
└── functions/                # Edge function stubs (generate-materials, etc.)
```
