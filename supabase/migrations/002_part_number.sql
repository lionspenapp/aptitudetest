-- ============================================================================
-- Migration 002: Add part_number to assessment_sessions
-- ============================================================================
--
-- Each module (Quantitative, Verbal) is now split into 2 parts of 20
-- questions each (40 total per module per quarter). Each completed part is
-- saved as its own row in assessment_sessions, distinguished by part_number.
--
-- Apply via the Supabase SQL editor or `supabase db push`.
-- ============================================================================

alter table assessment_sessions
  add column if not exists part_number integer default 1
  check (part_number in (1, 2));
