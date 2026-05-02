import type { PercentileBand, QuestionType, Tier } from "@/types/database";

/**
 * Local Report Generator — produces a complete structured report
 * without any API dependency. The Claude API narrative is optional.
 */

interface ReportData {
  studentName: string;
  enrolledGrade: number;
  module: "quantitative" | "verbal";
  rawScore: number;
  totalQuestions: number;
  geScore: number;
  percentileBand: PercentileBand;
  growthGap: number;
  tierReached: Tier;
  weakTypes: QuestionType[];
  strongTypes: QuestionType[];
}

const TIER_LABELS: Record<Tier, string> = {
  1: "Elementary (Tier 1)",
  2: "Intermediate (Tier 2)",
  3: "Advanced (Tier 3)",
  4: "Challenge (Tier 4)",
};

const MODULE_LABELS = {
  quantitative: "QUANTITATIVE APTITUDE",
  verbal: "VERBAL APTITUDE",
};

/**
 * Generate the structured local report text (no API required).
 * Mirrors the sample report format from the product plan:
 *
 * QUANTITATIVE APTITUDE
 * Score: 14/20 · Grade Equivalent: 7.2 · Above Average (78th percentile)
 * Tier Reached: Advanced (Tier 3) · Growth Gap: +1.2 grade levels
 * Strongest Areas: Pattern Reasoning ✓, Quantitative Analogy ✓
 * Growth Areas: Comparison Problems, Multi-step Reasoning
 */
export function generateStructuredReport(data: ReportData): string {
  const gapSign = data.growthGap >= 0 ? "+" : "";
  const strongList =
    data.strongTypes.length > 0
      ? data.strongTypes.map((t) => `${formatType(t)} ✓`).join(", ")
      : "N/A";
  const weakList =
    data.weakTypes.length > 0
      ? data.weakTypes.map((t) => formatType(t)).join(", ")
      : "None identified";

  return `${MODULE_LABELS[data.module]}
Score: ${data.rawScore}/${data.totalQuestions} · Grade Equivalent: ${data.geScore} · ${data.percentileBand}
Tier Reached: ${TIER_LABELS[data.tierReached]} · Growth Gap: ${gapSign}${data.growthGap} grade levels
Strongest Areas: ${strongList}
Growth Areas: ${weakList}`;
}

/**
 * Generate a composite report combining both modules.
 */
export function generateCompositeReport(params: {
  studentName: string;
  enrolledGrade: number;
  quantitative: ReportData | null;
  verbal: ReportData | null;
}): string {
  const parts: string[] = [];

  parts.push(`LION'S PEN APTITUDE ASSESSMENT REPORT`);
  parts.push(`Student: ${params.studentName} · Grade ${params.enrolledGrade}`);
  parts.push(`${"─".repeat(50)}`);

  if (params.quantitative) {
    parts.push("");
    parts.push(generateStructuredReport(params.quantitative));
  }

  if (params.verbal) {
    parts.push("");
    parts.push(generateStructuredReport(params.verbal));
  }

  if (params.quantitative && params.verbal) {
    const compositeGE =
      Math.round(((params.quantitative.geScore + params.verbal.geScore) / 2) * 10) / 10;
    const compositeGap =
      Math.round((compositeGE - params.enrolledGrade) * 10) / 10;
    const gapSign = compositeGap >= 0 ? "+" : "";

    parts.push("");
    parts.push(`${"─".repeat(50)}`);
    parts.push(
      `COMPOSITE GE: ${compositeGE} · Growth Gap: ${gapSign}${compositeGap} · ${params.quantitative.percentileBand}`
    );
  }

  return parts.join("\n");
}

/**
 * Format question type slug into readable label.
 */
function formatType(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    pattern: "Pattern Reasoning",
    analogy: "Analogies",
    reasoning: "Multi-step Reasoning",
    vocab: "Vocabulary",
    reading: "Reading Comprehension",
    language: "Language Reasoning",
    comparison: "Comparison Problems",
    functional_logic: "Functional Logic",
  };
  return labels[type] || type;
}
