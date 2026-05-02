"use client";

import { useAssessmentStore } from "@/store/assessment-store";
import type { Module } from "@/types/database";
import { getStartingTier } from "@/lib/scoring";

const MODULES: { key: Module; label: string; description: string }[] = [
  {
    key: "quantitative",
    label: "Quantitative Reasoning",
    description:
      "Number reasoning, patterns, quantitative analogies, and logic",
  },
  {
    key: "verbal",
    label: "Verbal Reasoning",
    description:
      "Analogies, vocabulary, reading comprehension, and language reasoning",
  },
];

export default function AssessmentPage() {
  const { currentModule, isComplete, totalAnswered, startSession, reset } =
    useAssessmentStore();

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Session Complete</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-2">
            You answered {totalAnswered} questions.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-8">
            Your results are being processed. Connect Supabase to save and view
            your full report.
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-foreground text-background px-6 py-3 font-medium hover:opacity-90 transition-opacity"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  if (currentModule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-bold mb-2">
            {currentModule === "quantitative"
              ? "Quantitative Reasoning"
              : "Verbal Reasoning"}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Question {totalAnswered + 1} of 20
          </p>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 mb-6">
            <p className="text-lg">
              Connect Supabase and populate the question bank to begin the
              adaptive assessment.
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            Questions are fetched one at a time from the Supabase{" "}
            <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
              questions
            </code>{" "}
            table, filtered by module and tier.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-2">Aptitude Assessment</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Select a module to begin your adaptive assessment session.
        </p>
      </div>
      <div className="grid gap-4 w-full max-w-md">
        {MODULES.map((mod) => (
          <button
            key={mod.key}
            onClick={() => startSession(mod.key, getStartingTier(6))}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <h2 className="text-lg font-semibold mb-1">{mod.label}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {mod.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
