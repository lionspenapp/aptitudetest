import type { PercentileBand, Tier } from "@/types/database";

/**
 * Calculate the Grade Equivalent score from correctly-answered questions.
 * GE = average difficulty_weight of correct items.
 */
export function calculateGEScore(correctDifficultyWeights: number[]): number {
  if (correctDifficultyWeights.length === 0) return 0;
  const sum = correctDifficultyWeights.reduce((a, b) => a + b, 0);
  return Math.round((sum / correctDifficultyWeights.length) * 10) / 10;
}

/**
 * Map a raw percentage score to a national percentile band label.
 */
export function getPercentileBand(
  rawScore: number,
  totalQuestions: number
): PercentileBand {
  const pct = (rawScore / totalQuestions) * 100;
  if (pct >= 90) return "Superior";
  if (pct >= 75) return "Above Average";
  if (pct >= 50) return "Average";
  if (pct >= 25) return "Developing";
  return "Needs Support";
}

/**
 * Determine the starting tier based on enrolled grade.
 */
export function getStartingTier(enrolledGrade: number): Tier {
  if (enrolledGrade <= 4) return 1;
  if (enrolledGrade <= 6) return 2;
  return 3;
}

/**
 * Compute the Growth Gap: GE score minus enrolled grade.
 */
export function calculateGrowthGap(
  geScore: number,
  enrolledGrade: number
): number {
  return Math.round((geScore - enrolledGrade) * 10) / 10;
}
