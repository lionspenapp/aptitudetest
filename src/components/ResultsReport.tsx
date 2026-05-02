"use client";

import type { PercentileBand, QuestionType, Tier } from "@/types/database";

interface ModuleResult {
  module: "quantitative" | "verbal";
  rawScore: number;
  totalQuestions: number;
  geScore: number;
  percentileBand: PercentileBand;
  growthGap: number;
  tierReached: Tier;
  strongTypes: QuestionType[];
  weakTypes: QuestionType[];
}

interface ResultsReportProps {
  studentName: string;
  enrolledGrade: number;
  results: ModuleResult[];
  narrative?: string;
  onStartNew: () => void;
}

const TIER_LABELS: Record<Tier, string> = {
  1: "Elementary (Tier 1)",
  2: "Intermediate (Tier 2)",
  3: "Advanced (Tier 3)",
  4: "Challenge (Tier 4)",
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

const BAND_COLORS: Record<PercentileBand, string> = {
  Superior: "bg-blue-900 text-white",
  "Above Average": "bg-green-600 text-white",
  Average: "bg-[#B8892A] text-white",
  Developing: "bg-orange-500 text-white",
  "Needs Support": "bg-red-700 text-white",
};

export default function ResultsReport({
  studentName,
  enrolledGrade,
  results,
  narrative,
  onStartNew,
}: ResultsReportProps) {
  const compositeGE =
    results.length === 2
      ? Math.round(((results[0].geScore + results[1].geScore) / 2) * 10) / 10
      : results[0]?.geScore ?? 0;

  const compositeGap =
    Math.round((compositeGE - enrolledGrade) * 10) / 10;

  const gapSign = compositeGap >= 0 ? "+" : "";

  return (
    <div className="min-h-screen bg-[#FAF7F0] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Report Header */}
        <div className="text-center mb-10">
          <span className="text-4xl block mb-3">🦁</span>
          <h1 className="text-2xl font-bold text-[#1A2744]">
            Aptitude Assessment Report
          </h1>
          <p className="text-[#1A2744]/60 mt-1">
            {studentName} · Grade {enrolledGrade}
          </p>
        </div>

        {/* Composite Score Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#B8892A]/20 p-8 mb-8 text-center">
          <p className="text-sm font-medium text-[#1A2744]/50 uppercase tracking-wider mb-2">
            Composite Grade Equivalent
          </p>
          <p className="text-5xl font-bold text-[#1A2744]">{compositeGE}</p>
          <p className="text-lg text-[#B8892A] font-semibold mt-2">
            Growth Gap: {gapSign}{compositeGap} grade levels
          </p>
          {results.length > 0 && (
            <span
              className={`inline-block mt-4 px-4 py-1.5 rounded-full text-sm font-semibold ${
                BAND_COLORS[results[0].percentileBand]
              }`}
            >
              {results[0].percentileBand}
            </span>
          )}
        </div>

        {/* Module Results */}
        {results.map((result) => (
          <div
            key={result.module}
            className="bg-white rounded-2xl shadow-md border border-[#1A2744]/10 p-6 mb-6"
          >
            <h2 className="text-lg font-bold text-[#1A2744] uppercase tracking-wide mb-4">
              {result.module === "quantitative"
                ? "🔢 Quantitative Aptitude"
                : "📖 Verbal Aptitude"}
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <StatBox
                label="Score"
                value={`${result.rawScore}/${result.totalQuestions}`}
              />
              <StatBox label="Grade Equivalent" value={String(result.geScore)} />
              <StatBox label="Tier Reached" value={TIER_LABELS[result.tierReached]} />
              <StatBox
                label="Growth Gap"
                value={`${result.growthGap >= 0 ? "+" : ""}${result.growthGap}`}
              />
            </div>

            {/* Strengths & Growth Areas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase mb-2">
                  Strongest Areas
                </p>
                {result.strongTypes.length > 0 ? (
                  <ul className="space-y-1">
                    {result.strongTypes.map((t) => (
                      <li
                        key={t}
                        className="text-sm text-[#1A2744]/80 flex items-center gap-1.5"
                      >
                        <span className="text-green-500">✓</span>
                        {TYPE_LABELS[t]}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#1A2744]/40">—</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase mb-2">
                  Growth Areas
                </p>
                {result.weakTypes.length > 0 ? (
                  <ul className="space-y-1">
                    {result.weakTypes.map((t) => (
                      <li
                        key={t}
                        className="text-sm text-[#1A2744]/80 flex items-center gap-1.5"
                      >
                        <span className="text-orange-400">→</span>
                        {TYPE_LABELS[t]}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#1A2744]/40">None identified</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* AI Narrative (if available) */}
        {narrative && (
          <div className="bg-white rounded-2xl shadow-md border border-[#B8892A]/15 p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#B8892A] uppercase tracking-wider mb-3">
              Personalized Narrative
            </h3>
            <p className="text-[#1A2744]/80 leading-relaxed whitespace-pre-line">
              {narrative}
            </p>
          </div>
        )}

        {/* Action */}
        <div className="text-center mt-10">
          <button
            onClick={onStartNew}
            className="px-8 py-3.5 rounded-xl bg-[#1A2744] text-white font-semibold shadow-md hover:bg-[#1A2744]/90 transition-colors"
          >
            Start New Assessment
          </button>
          <p className="text-xs text-[#1A2744]/40 mt-4">
            Lion&apos;s Pen · Becoming Ten Times Better
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#FAF7F0] border border-[#1A2744]/8 p-3 text-center">
      <p className="text-xs text-[#1A2744]/50 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-bold text-[#1A2744]">{value}</p>
    </div>
  );
}
