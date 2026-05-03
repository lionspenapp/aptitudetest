"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModuleMenu from "@/components/ModuleMenu";
import QuestionCard from "@/components/QuestionCard";
import { useAssessmentStore } from "@/store/assessment-store";
import type { Module, Question } from "@/types/database";

export default function AssessmentPage() {
  const router = useRouter();
  const {
    studentName,
    currentModule,
    totalAnswered,
    completedModules,
    startModule,
    setCurrentQuestion,
    recordAnswer,
    completeModule,
  } = useAssessmentStore();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect to setup if no student name
  useEffect(() => {
    if (!studentName) {
      router.push("/");
    }
  }, [studentName, router]);

  const handleModuleComplete = useCallback(() => {
    completeModule();
    setQuestion(null);
    const { completedModules: updated } = useAssessmentStore.getState();
    if (updated.length >= 2) {
      router.push("/results");
    }
  }, [completeModule, router]);

  const fetchQuestion = useCallback(() => {
    const { currentModule: mod, currentTier, usedQuestionIds, isComplete } =
      useAssessmentStore.getState();
    if (!mod || isComplete) return;

    setLoading(true);

    fetch("/api/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentModule: mod,
        currentTier,
        usedIds: usedQuestionIds,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.question) {
          setQuestion(data.question);
          setCurrentQuestion(data.question);
        } else {
          handleModuleComplete();
        }
      })
      .catch((err) => {
        console.error("Failed to fetch question:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setCurrentQuestion, handleModuleComplete]);

  const handleSelectModule = useCallback(
    (module: Module) => {
      setQuestion(null);
      startModule(module);
      fetchQuestion();
    },
    [startModule, fetchQuestion],
  );

  const handleAnswer = useCallback(
    (selectedIndex: number) => {
      recordAnswer(selectedIndex);

      setTimeout(() => {
        const { isComplete } = useAssessmentStore.getState();
        if (isComplete) {
          handleModuleComplete();
        } else {
          setQuestion(null);
          fetchQuestion();
        }
      }, 1300);
    },
    [recordAnswer, fetchQuestion, handleModuleComplete],
  );

  // No student — wait for redirect
  if (!studentName) return null;

  // No module selected — show module menu
  if (!currentModule) {
    return (
      <ModuleMenu
        onSelectModule={handleSelectModule}
        completedModules={completedModules}
      />
    );
  }

  // Loading state
  if (loading && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#B8892A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1A2744]/60 font-medium">Loading question...</p>
        </div>
      </div>
    );
  }

  // Show question
  if (question) {
    return (
      <QuestionCard
        question={question}
        questionNumber={totalAnswered + 1}
        totalQuestions={20}
        onAnswer={handleAnswer}
      />
    );
  }

  return null;
}
