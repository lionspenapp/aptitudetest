-- Enable the uuid-ossp extension for uuid_generate_v4()
create extension if not exists "uuid-ossp";

--------------------------------------------------------------------------------
-- Table: questions
-- Stores the 400-question adaptive item bank (200 quantitative + 200 verbal).
-- Each item belongs to a module, tier, and question type and carries a
-- calibrated difficulty_weight used for Grade Equivalent scoring.
--------------------------------------------------------------------------------
create table questions (
  id               uuid primary key default uuid_generate_v4(),
  module           text not null
                     constraint questions_module_check
                     check (module in ('quantitative', 'verbal')),
  tier             integer not null
                     constraint questions_tier_check
                     check (tier between 1 and 4),
  type             text not null
                     constraint questions_type_check
                     check (type in (
                       'pattern', 'analogy', 'reasoning',
                       'vocab', 'reading', 'language',
                       'comparison', 'functional_logic'
                     )),
  difficulty_weight decimal(3,1) not null
                     constraint questions_difficulty_weight_check
                     check (difficulty_weight between 3.0 and 10.9),
  question_text    text not null,
  passage          text,
  options          jsonb not null,
  correct_answer   integer not null
                     constraint questions_correct_answer_check
                     check (correct_answer between 0 and 3),
  explanation      text not null,
  created_at       timestamptz not null default now()
);

comment on table questions is
  'Adaptive item bank – 50 items per tier × 2 modules × 4 tiers = 400 items';

create index idx_questions_module_tier on questions (module, tier);

--------------------------------------------------------------------------------
-- Table: assessment_sessions
-- Records every completed assessment session, enabling quarter-over-quarter
-- growth tracking (Q1–Q4) per student per school year.
--------------------------------------------------------------------------------
create table assessment_sessions (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null,
  quarter         integer not null
                    constraint sessions_quarter_check
                    check (quarter between 1 and 4),
  school_year     text not null,
  module          text not null
                    constraint sessions_module_check
                    check (module in ('quantitative', 'verbal')),
  raw_score       integer not null,
  ge_score        decimal(3,1) not null,
  percentile_band text not null
                    constraint sessions_percentile_band_check
                    check (percentile_band in (
                      'Superior', 'Above Average', 'Average',
                      'Developing', 'Needs Support'
                    )),
  tier_reached    integer not null
                    constraint sessions_tier_reached_check
                    check (tier_reached between 1 and 4),
  weak_types      text[] not null default '{}',
  completed_at    timestamptz not null default now()
);

comment on table assessment_sessions is
  'One row per completed module session – enables quarterly growth tracking';

create index idx_sessions_student     on assessment_sessions (student_id);
create index idx_sessions_student_qtr on assessment_sessions (student_id, school_year, quarter);
