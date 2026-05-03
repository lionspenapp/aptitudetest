import type { PercentileBand, QuestionType, Tier } from "@/types/database";

/**
 * Scoring Engine — calculates GE score, percentile bands, and growth gap.
 *
 * GE Score = average difficulty_weight of all correctly answered questions
 * across BOTH parts of the module (40 total questions per module per quarter).
 *
 * Example: 27/40 correct, avg difficulty_weight 6.4 → GE = 6.4
 */

export interface ScoringAnswer {
  type: QuestionType;
  correct: boolean;
  difficulty_weight: number;
}

export function calculateGEScore(correctDifficultyWeights: number[]): number {
  if (correctDifficultyWeights.length === 0) return 0;
  const sum = correctDifficultyWeights.reduce((a, b) => a + b, 0);
  return Math.round((sum / correctDifficultyWeights.length) * 10) / 10;
}

/**
 * Map raw score to a national percentile band.
 *
 * 90th+ → Superior
 * 75–89 → Above Average
 * 50–74 → Average
 * 25–49 → Developing
 * <25   → Needs Support
 */
export function getPercentileBand(
  rawScore: number,
  totalQuestions: number
): PercentileBand {
  if (totalQuestions === 0) return "Needs Support";
  const pct = (rawScore / totalQuestions) * 100;
  if (pct >= 90) return "Superior";
  if (pct >= 75) return "Above Average";
  if (pct >= 50) return "Average";
  if (pct >= 25) return "Developing";
  return "Needs Support";
}

/**
 * Compute the Growth Gap: GE score minus enrolled grade.
 * Positive = above grade level, Negative = below grade level.
 */
export function calculateGrowthGap(
  geScore: number,
  enrolledGrade: number
): number {
  return Math.round((geScore - enrolledGrade) * 10) / 10;
}

/**
 * Identify weak question types — types where the student got ≥50% wrong.
 */
export function identifyWeakTypes(
  answers: { type: QuestionType; correct: boolean }[]
): QuestionType[] {
  const typeStats: Record<string, { total: number; wrong: number }> = {};

  for (const answer of answers) {
    if (!typeStats[answer.type]) {
      typeStats[answer.type] = { total: 0, wrong: 0 };
    }
    typeStats[answer.type].total++;
    if (!answer.correct) {
      typeStats[answer.type].wrong++;
    }
  }

  const weakTypes: QuestionType[] = [];
  for (const [type, stats] of Object.entries(typeStats)) {
    if (stats.wrong / stats.total >= 0.5) {
      weakTypes.push(type as QuestionType);
    }
  }

  return weakTypes;
}

/**
 * Identify strong question types — types where the student got ≥75% correct
 * (and at least one item of that type was answered).
 */
export function identifyStrongTypes(
  answers: { type: QuestionType; correct: boolean }[]
): QuestionType[] {
  const typeStats: Record<string, { total: number; correct: number }> = {};

  for (const answer of answers) {
    if (!typeStats[answer.type]) {
      typeStats[answer.type] = { total: 0, correct: 0 };
    }
    typeStats[answer.type].total++;
    if (answer.correct) {
      typeStats[answer.type].correct++;
    }
  }

  const strongTypes: QuestionType[] = [];
  for (const [type, stats] of Object.entries(typeStats)) {
    if (stats.total > 0 && stats.correct / stats.total >= 0.75) {
      strongTypes.push(type as QuestionType);
    }
  }

  return strongTypes;
}

/**
 * Determine the highest tier the student reached during the session.
 */
export function getHighestTierReached(tierHistory: Tier[]): Tier {
  if (tierHistory.length === 0) return 1;
  return Math.max(...tierHistory) as Tier;
}

/**
 * Combine a module's two parts into a single scored result.
 *
 * Combines part1Answers + part2Answers (40 total when both parts complete) and
 * scores them as one. Tier reached is the max across both parts' tier history.
 */
export function scoreModule(params: {
  enrolledGrade: number;
  module: "quantitative" | "verbal";
  part1Answers: ScoringAnswer[];
  part2Answers: ScoringAnswer[];
  part1TierHistory: Tier[];
  part2TierHistory: Tier[];
}) {
  const allAnswers: ScoringAnswer[] = [
    ...params.part1Answers,
    ...params.part2Answers,
  ];

  const correctDifficultyWeights = allAnswers
    .filter((a) => a.correct)
    .map((a) => a.difficulty_weight);

  const rawScore = correctDifficultyWeights.length;
  const totalQuestions = allAnswers.length;

  const geScore = calculateGEScore(correctDifficultyWeights);
  const percentileBand = getPercentileBand(rawScore, totalQuestions);
  const growthGap = calculateGrowthGap(geScore, params.enrolledGrade);
  const tierReached = getHighestTierReached([
    ...params.part1TierHistory,
    ...params.part2TierHistory,
  ]);
  const weakTypes = identifyWeakTypes(allAnswers);
  const strongTypes = identifyStrongTypes(allAnswers);

  return {
    module: params.module,
    rawScore,
    totalQuestions,
    geScore,
    percentileBand,
    growthGap,
    tierReached,
    weakTypes,
    strongTypes,
  };
}

/**
 * Generate the full local scoring summary for a single sitting (legacy helper
 * retained for any caller that scores a single 20-question session).
 */
export function generateLocalReport(params: {
  studentName: string;
  enrolledGrade: number;
  module: "quantitative" | "verbal";
  rawScore: number;
  totalQuestions: number;
  correctDifficultyWeights: number[];
  tierHistory: Tier[];
  answers: { type: QuestionType; correct: boolean }[];
}) {
  const geScore = calculateGEScore(params.correctDifficultyWeights);
  const percentileBand = getPercentileBand(params.rawScore, params.totalQuestions);
  const growthGap = calculateGrowthGap(geScore, params.enrolledGrade);
  const tierReached = getHighestTierReached(params.tierHistory);
  const weakTypes = identifyWeakTypes(params.answers);
  const strongTypes = identifyStrongTypes(params.answers);

  return {
    studentName: params.studentName,
    enrolledGrade: params.enrolledGrade,
    module: params.module,
    rawScore: params.rawScore,
    totalQuestions: params.totalQuestions,
    geScore,
    percentileBand,
    growthGap,
    tierReached,
    weakTypes,
    strongTypes,
  };
}
