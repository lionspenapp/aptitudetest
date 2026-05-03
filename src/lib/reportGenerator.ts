import type { PercentileBand, QuestionType, Tier } from "@/types/database";

/**
 * Local Report Generator — produces a complete structured report
 * without any API dependency. The Claude API narrative (see
 * /api/generate-report) is an optional enhancement that runs only after
 * this local report is built.
 */

export interface ModuleReportData {
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

export interface CompositeReport {
  studentName: string;
  enrolledGrade: number;
  modules: ModuleReportData[];
  composite: {
    geScore: number;
    growthGap: number;
    percentileBand: PercentileBand;
    strongTypes: QuestionType[];
    weakTypes: QuestionType[];
    tierReached: Tier;
  } | null;
  text: string;
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

const TYPE_LABELS: Record<QuestionType, string> = {
  pattern: "Pattern Reasoning",
  analogy: "Analogies",
  reasoning: "Multi-step Reasoning",
  vocab: "Vocabulary",
  reading: "Reading Comprehension",
  language: "Language Reasoning",
  comparison: "Comparison Problems",
  functional_logic: "Functional Logic",
};

/**
 * Generate the structured local report text for a single module.
 *
 * Mirrors the sample report format from the product plan:
 *
 *   QUANTITATIVE APTITUDE
 *   Score: 27/40 · Grade Equivalent: 7.2 · Above Average
 *   Tier Reached: Advanced (Tier 3) · Growth Gap: +1.2 grade levels
 *   Strongest Areas: Pattern Reasoning ✓, Analogies ✓
 *   Growth Areas: Comparison Problems, Multi-step Reasoning
 */
export function generateStructuredReport(data: ModuleReportData): string {
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
 * Generate a composite report combining all completed modules.
 * Returns both the structured object and a plain-text rendering.
 */
export function generateCompositeReport(params: {
  studentName: string;
  enrolledGrade: number;
  modules: ModuleReportData[];
}): CompositeReport {
  const { studentName, enrolledGrade, modules } = params;
  const lines: string[] = [];

  lines.push(`LION'S PEN APTITUDE ASSESSMENT REPORT`);
  lines.push(`Student: ${studentName} · Grade ${enrolledGrade}`);
  lines.push("─".repeat(50));

  for (const m of modules) {
    lines.push("");
    lines.push(generateStructuredReport(m));
  }

  let composite: CompositeReport["composite"] = null;

  if (modules.length > 0) {
    const compositeGE =
      Math.round(
        (modules.reduce((acc, m) => acc + m.geScore, 0) / modules.length) * 10
      ) / 10;
    const compositeGap = Math.round((compositeGE - enrolledGrade) * 10) / 10;
    const totalRaw = modules.reduce((acc, m) => acc + m.rawScore, 0);
    const totalQuestions = modules.reduce(
      (acc, m) => acc + m.totalQuestions,
      0
    );
    const percentileBand =
      totalQuestions > 0
        ? bandFromPct((totalRaw / totalQuestions) * 100)
        : ("Needs Support" as PercentileBand);

    const strongTypes = uniqueTypes(modules.flatMap((m) => m.strongTypes));
    const weakTypes = uniqueTypes(modules.flatMap((m) => m.weakTypes));
    const tierReached = Math.max(...modules.map((m) => m.tierReached)) as Tier;

    composite = {
      geScore: compositeGE,
      growthGap: compositeGap,
      percentileBand,
      strongTypes,
      weakTypes,
      tierReached,
    };

    const gapSign = compositeGap >= 0 ? "+" : "";
    lines.push("");
    lines.push("─".repeat(50));
    lines.push(
      `COMPOSITE GE: ${compositeGE} · Growth Gap: ${gapSign}${compositeGap} · ${percentileBand}`
    );
  }

  return {
    studentName,
    enrolledGrade,
    modules,
    composite,
    text: lines.join("\n"),
  };
}

function formatType(type: QuestionType): string {
  return TYPE_LABELS[type] || type;
}

function uniqueTypes(types: QuestionType[]): QuestionType[] {
  return Array.from(new Set(types));
}

function bandFromPct(pct: number): PercentileBand {
  if (pct >= 90) return "Superior";
  if (pct >= 75) return "Above Average";
  if (pct >= 50) return "Average";
  if (pct >= 25) return "Developing";
  return "Needs Support";
}
