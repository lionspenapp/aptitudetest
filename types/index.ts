/**
 * Shared type definitions for the Lion's Pen Aptitude Assessment.
 * Re-exports all database types and adds application-level types.
 */

export type Module = "quantitative" | "verbal";

export type QuestionType =
  | "pattern"
  | "analogy"
  | "reasoning"
  | "vocab"
  | "reading"
  | "language"
  | "comparison"
  | "functional_logic";

export type Tier = 1 | 2 | 3 | 4;

export type PercentileBand =
  | "Superior"
  | "Above Average"
  | "Average"
  | "Developing"
  | "Needs Support";

export interface Question {
  id: string;
  module: Module;
  tier: Tier;
  type: QuestionType;
  difficulty_weight: number;
  question_text: string;
  passage: string | null;
  options: string[];
  correct_answer: number;
  explanation: string;
  created_at: string;
}

export interface AssessmentSession {
  id: string;
  student_id: string;
  quarter: 1 | 2 | 3 | 4;
  school_year: string;
  module: Module;
  raw_score: number;
  ge_score: number;
  percentile_band: PercentileBand;
  tier_reached: Tier;
  weak_types: QuestionType[];
  completed_at: string;
}

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: Question;
        Insert: Omit<Question, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Question, "id">>;
      };
      assessment_sessions: {
        Row: AssessmentSession;
        Insert: Omit<AssessmentSession, "id" | "completed_at"> & {
          id?: string;
          completed_at?: string;
        };
        Update: Partial<Omit<AssessmentSession, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
