# Lion's Pen · Aptitude Assessment

Nationally-normed adaptive aptitude assessment for Grades 3–8. Measures cognitive reasoning — not curriculum knowledge — across **Quantitative Reasoning** and **Verbal Reasoning** modules.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| State | Zustand |
| API (optional) | Anthropic Claude — narrative report generation |
| Hosting | Vercel / Netlify |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables and fill in your Supabase credentials
cp .env.local.example .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/` to create the `questions` and `assessment_sessions` tables.
3. Copy your project URL and anon key into `.env.local`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── api/generate-report/   # Claude API route (server-side only)
│   ├── assessment/            # Assessment session UI
│   ├── layout.tsx
│   └── page.tsx               # Landing page
├── components/                # Shared UI components
├── lib/
│   ├── scoring.ts             # GE score calculation, percentile bands
│   ├── supabase-client.ts     # Browser Supabase client
│   └── supabase-server.ts     # Server-side Supabase client
├── store/
│   └── assessment-store.ts    # Zustand session state
└── types/
    └── database.ts            # TypeScript types matching Supabase schema
supabase/
└── migrations/                # SQL migration files
```
