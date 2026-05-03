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
  const [needsFetch, setNeedsFetch] = useState(false);

  useEffect(() => {
    if (!studentName) {
      router.push("/");
    }
  }, [studentName, router]);

  useEffect(() => {
    if (currentModule && currentPart && !question && !loading) {
      setNeedsFetch(true);
    }
  }, [currentModule, currentPart, question, loading]);

  useEffect(() => {
    if (!needsFetch || !currentModule || !currentPart || isPartComplete) {
      return;
    }

    setNeedsFetch(false);
    setLoading(true);

    fetch("/api/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentModule,
        currentTier,
        usedIds: usedQuestionIdsByModule[currentModule] ?? [],
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.question) {
          setQuestion(data.question);
          setCurrentQuestion(data.question);
        } else {
          handlePartComplete();
        }
      })
      .catch((err) => {
        console.error("Failed to fetch question:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [needsFetch]); // eslint-disable-line react-hooks/exhaustive-deps

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
    startPart(mod, part);
    setNeedsFetch(true);
  };

  const handleViewReport = () => {
    router.push("/results");
  };

  const handleAnswer = (selectedIndex: number) => {
    recordAnswer(selectedIndex);
    setTimeout(() => {
      setQuestion(null);
      setNeedsFetch(true);
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
