"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModuleMenu, { type PartStatus } from "@/components/ModuleMenu";
import QuestionCard from "@/components/QuestionCard";
import {
  useAssessmentStore,
  QUESTIONS_PER_SESSION,
} from "@/store/assessment-store";
import type { Module, PartNumber, Question } from "@/types/database";

export default function AssessmentPage() {
  const router = useRouter();
  const {
    studentName,
    currentModule,
    currentPart,
    currentTier,
    usedQuestionIdsByModule,
    totalAnswered,
    isPartComplete,
    sessions,
    moduleResults,
    startPart,
    setCurrentQuestion,
    recordAnswer,
    completePart,
    isPartUnlocked,
    isPartDone,
    allPartsCompleted,
  } = useAssessmentStore();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Monotonic counter — every increment guarantees the fetch effect fires
  // again, even if previous flags were left stale by a part ending naturally.
  const [fetchToken, setFetchToken] = useState(0);
  const requestFetch = () => setFetchToken((t) => t + 1);

  useEffect(() => {
    if (!studentName) {
      router.push("/");
    }
  }, [studentName, router]);

  useEffect(() => {
    if (
      fetchToken === 0 ||
      !currentModule ||
      !currentPart ||
      isPartComplete
    ) {
      return;
    }

    setLoading(true);
    setFetchError(null);

    const recentTypes = sessions[currentModule][currentPart].answers
      .slice(-6)
      .map((a) => a.type);

    fetch("/api/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentModule,
        currentTier,
        usedIds: usedQuestionIdsByModule[currentModule] ?? [],
        recentTypes,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const hint =
            typeof data.hint === "string"
              ? data.hint
              : typeof data.error === "string"
                ? data.error
                : res.status === 503
                  ? "The server cannot reach Supabase. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Environment Variables, then redeploy."
                  : typeof data.details === "string"
                    ? data.details
                    : `Request failed (${res.status}).`;

          throw new Error(hint);
        }

        return data as { question?: Question };
      })
      .then((data) => {
        if (data?.question) {
          setQuestion(data.question);
          setCurrentQuestion(data.question);
          setFetchError(null);
          return;
        }
        handlePartComplete();
      })
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : "Could not load a question (network error). Try again.";
        console.error("Failed to fetch question:", err);
        setFetchError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isPartComplete && currentModule && currentPart) {
      handlePartComplete();
    }
  }, [isPartComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  async function persistPartIfPossible(
    mod: Module,
    part: PartNumber,
    rawScore: number,
    geScore: number,
    percentileBand: string,
    tierReached: number,
    weakTypes: string[]
  ) {
    try {
      await fetch("/api/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: mod,
          partNumber: part,
          rawScore,
          geScore,
          percentileBand,
          tierReached,
          weakTypes,
        }),
      });
    } catch {
      // Persistence is best-effort — local report is unaffected.
    }
  }

  function handlePartComplete() {
    const mod = currentModule;
    const part = currentPart;
    if (!mod || !part) return;

    const partState = sessions[mod][part];
    const rawScore = partState.answers.filter((a) => a.correct).length;

    completePart();
    setQuestion(null);

    void persistPartIfPossible(
      mod,
      part,
      rawScore,
      0,
      "",
      Math.max(...(partState.tierHistory.length ? partState.tierHistory : [1])),
      []
    );

    if (allPartsCompleted()) {
      router.push("/results");
    }
  }

  const handleSelectPart = (mod: Module, part: PartNumber) => {
    setQuestion(null);
    setFetchError(null);
    setLoading(false);
    startPart(mod, part);
    requestFetch();
  };

  const handleViewReport = () => {
    router.push("/results");
  };

  const handleAnswer = (selectedIndex: number) => {
    recordAnswer(selectedIndex);
    setTimeout(() => {
      setQuestion(null);
      requestFetch();
    }, 1300);
  };

  if (!studentName) return null;

  if (!currentModule || !currentPart) {
    const partStatuses: PartStatus[] = (
      ["quantitative", "verbal"] as Module[]
    ).flatMap((m) =>
      ([1, 2] as PartNumber[]).map((p) => ({
        module: m,
        part: p,
        done: isPartDone(m, p),
        unlocked: isPartUnlocked(m, p),
      }))
    );

    return (
      <ModuleMenu
        partStatuses={partStatuses}
        allDone={allPartsCompleted() && moduleResults.length > 0}
        onSelectPart={handleSelectPart}
        onViewReport={handleViewReport}
      />
    );
  }

  if (loading && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#B8892A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1A2744]/60 font-medium">Loading question...</p>
          <p className="text-xs text-[#1A2744]/40 mt-2">
            {currentModule === "quantitative" ? "Quantitative" : "Verbal"} ·
            Part {currentPart}
          </p>
        </div>
      </div>
    );
  }

  if (!question && fetchError && currentModule && currentPart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-[#1A2744]">
            Could not load question
          </h2>
          <p className="mt-3 text-sm text-[#1A2744]/80 whitespace-pre-wrap">
            {fetchError}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setFetchError(null);
                requestFetch();
              }}
              className="rounded-xl bg-[#B8892A] px-4 py-3 font-semibold text-white shadow hover:bg-[#9A7223]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                setFetchError(null);
                setQuestion(null);
                router.push("/");
              }}
              className="rounded-xl border border-[#1A2744]/20 px-4 py-3 font-semibold text-[#1A2744]"
            >
              Back to setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (question) {
    return (
      <QuestionCard
        question={question}
        questionNumber={totalAnswered + 1}
        totalQuestions={QUESTIONS_PER_SESSION}
        onAnswer={handleAnswer}
      />
    );
  }

  return null;
}
