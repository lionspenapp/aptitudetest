export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ExamFormat = "multiple_choice" | "short_answer" | "mixed_frq";
export type EvaluationTier = "green" | "yellow" | "red";
export type SubscriptionTier = "free" | "premium";
export type SpacedPhase =
  | "block1_text"
  | "distractor1"
  | "block2_graphic"
  | "distractor2"
  | "block3_problems"
  | "complete";

export interface CurriculumProfile {
  id: string;
  name: string;
  framework: string;
  created_at: string;
}

export interface CurriculumUnit {
  id: string;
  profile_id: string;
  unit_number: number;
  title: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  course_level: string;
  topic_title: string;
  question_count: number;
  exam_format: ExamFormat;
  exam_timestamp: string;
  raw_canvas_dump: string | null;
  sleep_validation_score: number | null;
  profile_id: string | null;
  unit_id: string | null;
  created_at: string;
}

export interface SessionMaterial {
  id: string;
  session_id: string;
  text_module: string;
  graphic_module_svg: string;
  problem_solving_json: Json;
  created_at: string;
}

export interface ProblemScenario {
  scenario: string;
  questions: string[];
}

export interface KnowledgePillar {
  id: string;
  session_id: string;
  pillar_number: number;
  concept_name: string;
  evaluation_tier: EvaluationTier | null;
  diagnostic_feedback: string | null;
  is_mastered: boolean;
  updated_at: string;
}

export interface MaterialCache {
  cache_key: string;
  session_materials_payload: Json;
  pillars_payload: Json;
  hit_count: number;
  created_at: string;
}

export interface UserSubscription {
  user_id: string;
  tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionProgress {
  session_id: string;
  current_phase: SpacedPhase;
  stuck_uses: number;
  phase_started_at: string;
  spaced_complete: boolean;
  warm_up_complete: boolean;
  flash_glance_complete: boolean;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      curriculum_profiles: {
        Row: CurriculumProfile;
        Insert: Omit<CurriculumProfile, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CurriculumProfile, "id">>;
        Relationships: [];
      };
      curriculum_units: {
        Row: CurriculumUnit;
        Insert: Omit<CurriculumUnit, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CurriculumUnit, "id">>;
        Relationships: [];
      };
      study_sessions: {
        Row: StudySession;
        Insert: Omit<StudySession, "id" | "created_at" | "raw_canvas_dump" | "sleep_validation_score"> & {
          id?: string;
          raw_canvas_dump?: string | null;
          sleep_validation_score?: number | null;
          created_at?: string;
        };
        Update: Partial<Omit<StudySession, "id">>;
        Relationships: [];
      };
      session_materials: {
        Row: SessionMaterial;
        Insert: Omit<SessionMaterial, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SessionMaterial, "id">>;
        Relationships: [];
      };
      knowledge_pillars: {
        Row: KnowledgePillar;
        Insert: Omit<KnowledgePillar, "id" | "updated_at" | "evaluation_tier" | "diagnostic_feedback" | "is_mastered"> & {
          id?: string;
          evaluation_tier?: EvaluationTier | null;
          diagnostic_feedback?: string | null;
          is_mastered?: boolean;
          updated_at?: string;
        };
        Update: Partial<Omit<KnowledgePillar, "id">>;
        Relationships: [];
      };
      material_cache: {
        Row: MaterialCache;
        Insert: Omit<MaterialCache, "hit_count" | "created_at"> & {
          hit_count?: number;
          created_at?: string;
        };
        Update: Partial<Omit<MaterialCache, "cache_key">>;
        Relationships: [];
      };
      user_subscriptions: {
        Row: UserSubscription;
        Insert: {
          user_id: string;
          tier?: SubscriptionTier;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserSubscription, "user_id">>;
        Relationships: [];
      };
      session_progress: {
        Row: SessionProgress;
        Insert: Omit<SessionProgress, "updated_at" | "stuck_uses" | "spaced_complete" | "warm_up_complete" | "flash_glance_complete"> & {
          stuck_uses?: number;
          spaced_complete?: boolean;
          warm_up_complete?: boolean;
          flash_glance_complete?: boolean;
          updated_at?: string;
        };
        Update: Partial<Omit<SessionProgress, "session_id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
