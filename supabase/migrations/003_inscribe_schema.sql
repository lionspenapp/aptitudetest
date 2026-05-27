-- InScribe schema migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Curriculum profiles (FR-1.1)
CREATE TABLE curriculum_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  framework TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE curriculum_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES curriculum_profiles(id) ON DELETE CASCADE,
  unit_number INT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study sessions (PRD Section 4)
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_level TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  question_count INT NOT NULL,
  exam_format TEXT NOT NULL CHECK (exam_format IN ('multiple_choice', 'short_answer', 'mixed_frq')),
  exam_timestamp TIMESTAMPTZ NOT NULL,
  raw_canvas_dump TEXT,
  sleep_validation_score INT DEFAULT NULL,
  profile_id UUID REFERENCES curriculum_profiles(id),
  unit_id UUID REFERENCES curriculum_units(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  text_module TEXT NOT NULL,
  graphic_module_svg TEXT NOT NULL,
  problem_solving_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  pillar_number INT NOT NULL,
  concept_name TEXT NOT NULL,
  evaluation_tier TEXT CHECK (evaluation_tier IN ('green', 'yellow', 'red')),
  diagnostic_feedback TEXT,
  is_mastered BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global LLM response cache (FR-6.1)
CREATE TABLE material_cache (
  cache_key TEXT PRIMARY KEY,
  session_materials_payload JSONB NOT NULL,
  pillars_payload JSONB NOT NULL,
  hit_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription tier (FR-6.2)
CREATE TABLE user_subscriptions (
  user_id UUID PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session runtime state
CREATE TABLE session_progress (
  session_id UUID PRIMARY KEY REFERENCES study_sessions(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL DEFAULT 'block1_text',
  stuck_uses INT DEFAULT 0,
  phase_started_at TIMESTAMPTZ DEFAULT NOW(),
  spaced_complete BOOLEAN DEFAULT FALSE,
  warm_up_complete BOOLEAN DEFAULT FALSE,
  flash_glance_complete BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE curriculum_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_progress ENABLE ROW LEVEL SECURITY;

-- Curriculum is public read
CREATE POLICY "Curriculum profiles are publicly readable"
  ON curriculum_profiles FOR SELECT USING (true);

CREATE POLICY "Curriculum units are publicly readable"
  ON curriculum_units FOR SELECT USING (true);

-- Study sessions: users own their data
CREATE POLICY "Users can view own study sessions"
  ON study_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Session materials via session ownership
CREATE POLICY "Users can view own session materials"
  ON session_materials FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM study_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own session materials"
  ON session_materials FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM study_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

-- Knowledge pillars via session ownership
CREATE POLICY "Users can view own knowledge pillars"
  ON knowledge_pillars FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM study_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own knowledge pillars"
  ON knowledge_pillars FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM study_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own knowledge pillars"
  ON knowledge_pillars FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM study_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

-- Material cache: public read, service role write (API uses service key for writes)
CREATE POLICY "Material cache is publicly readable"
  ON material_cache FOR SELECT USING (true);

-- User subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Session progress via session ownership
CREATE POLICY "Users can view own session progress"
  ON session_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM study_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own session progress"
  ON session_progress FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM study_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own session progress"
  ON session_progress FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM study_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  ));
