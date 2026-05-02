import { createClient } from "@/lib/supabase-client";
import type { Question, Module, Tier } from "@/types/database";

/**
 * Adaptive Engine — manages tier routing and question fetching.
 *
 * Branching Rules:
 * - Entry Point: enrolled grade determines starting tier (Gr 3–4 → T1, Gr 5–6 → T2, Gr 7–8 → T3)
 * - Level Up: 3 correct in a row → advance to next tier
 * - Level Down: 2 incorrect → drop to previous tier
 * - Ceiling: tops out Tier 4 → test ends, max GE
 * - Floor: drops below Tier 1 → test ends, min GE
 */

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
  // Level Up: 3 correct in a row
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

  // Level Down: 2 incorrect
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
 * Fetch the next question from Supabase, filtered by module and tier,
 * excluding already-used question IDs.
 */
export async function fetchNextQuestion(
  currentModule: Module,
  currentTier: Tier,
  usedIds: string[]
): Promise<Question | null> {
  const supabase = createClient();

  let query = supabase
    .from("questions")
    .select("*")
    .eq("module", currentModule)
    .eq("tier", currentTier);

  if (usedIds.length > 0) {
    query = query.not("id", "in", `(${usedIds.join(",")})`);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) return null;
  return data as Question;
}
