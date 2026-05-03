import { createClient } from "@/lib/supabase-client";
import type { Question, Module, Tier, PartNumber, QuestionType } from "@/types/database";

/**
 * Adaptive Engine — manages tier routing and question fetching.
 *
 * Branching Rules:
 * - Entry Point: enrolled grade determines starting tier (Gr 3–4 → T1, Gr 5–6 → T2, Gr 7–8 → T3)
 * - Level Up: 3 correct in a row → advance to next tier
 * - Level Down: 2 incorrect → drop to previous tier
 * - Ceiling: tops out Tier 4 → test ends, max GE
 * - Floor: drops below Tier 1 → test ends, min GE
 *
 * Quarterly structure:
 * - Each module is split into PARTS_PER_MODULE = 2 parts.
 * - Each sitting (part) is QUESTIONS_PER_SESSION = 20 questions.
 * - Total per module per quarter = 40 questions.
 * - Part 2 is locked until Part 1 is complete.
 */

export const QUESTIONS_PER_SESSION = 20;
export const PARTS_PER_MODULE = 2;
export const NIL_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * In-memory representation of a single 20-question sitting.
 * Mirrors the ModuleSession type in @/types/database, kept here as a
 * convenience re-export for adaptive-engine consumers.
 */
export interface ModuleSession {
  module: Module;
  part_number: PartNumber;
  tier_history: Tier[];
  used_question_ids: string[];
  answers: { type: QuestionType; correct: boolean; difficulty_weight: number }[];
  completed: boolean;
}

export function getStartingTier(enrolledGrade: number): Tier {
  if (enrolledGrade <= 4) return 1;
  if (enrolledGrade <= 6) return 2;
  return 3;
}

export function adjustTier(
  currentTier: Tier,
  consecutiveCorrect: number,
  consecutiveIncorrect: number
): { newTier: Tier; shouldEnd: boolean; resetCorrect: boolean; resetIncorrect: boolean } {
  if (consecutiveCorrect >= 3) {
    if (currentTier >= 4) {
      return { newTier: 4, shouldEnd: true, resetCorrect: true, resetIncorrect: true };
    }
    return {
      newTier: (currentTier + 1) as Tier,
      shouldEnd: false,
      resetCorrect: true,
      resetIncorrect: true,
    };
  }

  if (consecutiveIncorrect >= 2) {
    if (currentTier <= 1) {
      return { newTier: 1, shouldEnd: true, resetCorrect: true, resetIncorrect: true };
    }
    return {
      newTier: (currentTier - 1) as Tier,
      shouldEnd: false,
      resetCorrect: true,
      resetIncorrect: true,
    };
  }

  return { newTier: currentTier, shouldEnd: false, resetCorrect: false, resetIncorrect: false };
}

/**
 * Build a Postgrest-safe `not in` clause for excluding already-used question
 * IDs. When the list is empty, falls back to a sentinel UUID so the clause is
 * always well-formed.
 */
export function buildExcludedIdsClause(usedIds: string[]): string {
  return `(${usedIds.length > 0 ? usedIds.join(",") : NIL_UUID})`;
}

/**
 * Fetch the next question from Supabase, filtered by module and tier,
 * excluding already-used question IDs. Picks randomly from the candidate
 * pool, preferring question types that haven't appeared in the last few
 * questions (so the student doesn't get e.g. five analogies in a row).
 */
export async function fetchNextQuestion(
  currentModule: Module,
  currentTier: Tier,
  usedIds: string[],
  recentTypes: QuestionType[] = []
): Promise<Question | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("module", currentModule)
    .eq("tier", currentTier)
    .not("id", "in", buildExcludedIdsClause(usedIds));

  if (error || !data || data.length === 0) return null;
  return pickDiverseQuestion(data as Question[], recentTypes);
}

/**
 * Pick a question from `candidates`, preferring types that haven't appeared
 * in the last few questions. Used by both the API route and any in-process
 * caller of fetchNextQuestion.
 */
export function pickDiverseQuestion(
  candidates: Question[],
  recentTypes: QuestionType[]
): Question | null {
  if (candidates.length === 0) return null;

  const window = recentTypes.slice(-6);
  const typeFrequency = new Map<string, number>();
  for (const t of window) {
    typeFrequency.set(t, (typeFrequency.get(t) ?? 0) + 1);
  }

  let minFreq = Infinity;
  const buckets = new Map<number, Question[]>();
  for (const c of candidates) {
    const freq = typeFrequency.get(c.type) ?? 0;
    if (freq < minFreq) minFreq = freq;
    const bucket = buckets.get(freq) ?? [];
    bucket.push(c);
    buckets.set(freq, bucket);
  }

  const preferred = buckets.get(minFreq) ?? candidates;
  return preferred[Math.floor(Math.random() * preferred.length)];
}
