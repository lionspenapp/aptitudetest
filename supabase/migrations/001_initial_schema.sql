-- Enable the uuid-ossp extension for uuid_generate_v4()
create extension if not exists "uuid-ossp";

-- ============================================================================
-- Table: students
-- ============================================================================
create table students (
  id             uuid primary key default uuid_generate_v4(),
  full_name      text not null,
  grade_level    integer not null,
  parent_email   text,
  created_at     timestamp default now()
);

-- ============================================================================
-- Table: questions
-- ============================================================================
create table questions (
  id                uuid primary key default uuid_generate_v4(),
  module            text not null,           -- "quantitative" | "verbal"
  tier              integer not null,        -- 1 | 2 | 3 | 4
  type              text not null,           -- "pattern" | "analogy" | "reasoning" | "vocab" | "reading" | "language"
  difficulty_weight decimal(3,1) not null,   -- Grade Equivalent (e.g., 6.4)
  question_text     text not null,
  passage           text,                    -- Reading comprehension passages (nullable)
  options           jsonb not null,          -- ["A","B","C","D"]
  correct_answer    integer not null,        -- 0-indexed
  explanation       text not null,
  created_at        timestamp default now()
);

-- ============================================================================
-- Table: assessment_sessions
-- ============================================================================
create table assessment_sessions (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid references students(id),
  quarter         integer,                   -- 1 | 2 | 3 | 4
  school_year     text,                      -- e.g., "2025-2026"
  module          text,                      -- "quantitative" | "verbal"
  raw_score       integer,
  ge_score        decimal(3,1),              -- Grade Equivalent
  percentile_band text,
  tier_reached    integer,
  weak_types      text[],                    -- question types missed
  completed_at    timestamp default now()
);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table students enable row level security;
alter table questions enable row level security;
alter table assessment_sessions enable row level security;

-- Questions are public content — anyone can read them
create policy "Questions are publicly readable"
  on questions for select
  using (true);

-- Students: only authenticated users can read/insert their own data
create policy "Users can view their own student record"
  on students for select
  using (auth.uid() = id);

create policy "Users can insert their own student record"
  on students for insert
  with check (auth.uid() = id);

-- Assessment sessions: users can only access their own sessions
create policy "Users can view their own sessions"
  on assessment_sessions for select
  using (auth.uid() = student_id);

create policy "Users can insert their own sessions"
  on assessment_sessions for insert
  with check (auth.uid() = student_id);
