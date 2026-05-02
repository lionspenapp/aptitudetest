"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleMenu from "@/components/ModuleMenu";
import QuestionCard from "@/components/QuestionCard";
import { useAssessmentStore } from "@/store/assessment-store";
import type { Module } from "@/types/database";

export default function AssessmentPage() {
  const router = useRouter();
  const {
    studentName,
    currentModule,
    currentTier,
    currentQuestion,
    usedQuestionIds,
    totalAnswered,
    isComplete,
    isLoading,
    completedModules,
    startModule,
    setCurrentQuestion,
    setLoading,
    recordAnswer,
    completeModule,
  } = useAssessmentStore();

  // Redirect to setup if no student name
  useEffect(() => {
    if (!studentName) {
      router.push("/");
    }
  }, [studentName, router]);

  // Fetch next question when module starts or after an answer
  const fetchQuestion = useCallback(async () => {
    if (!currentModule || isComplete) return;

    setLoading(true);
    try {
      const res = await fetch("/api/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentModule,
          currentTier,
          usedIds: usedQuestionIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentQuestion(data.question);
      } else {
        // No more questions available — end the session
        completeModule();
        if (completedModules.length + 1 >= 2) {
          router.push("/results");
        }
      }
    } catch (error) {
      console.error("Failed to fetch question:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentModule,
    currentTier,
    usedQuestionIds,
    isComplete,
    setCurrentQuestion,
    setLoading,
    completeModule,
    completedModules.length,
    router,
  ]);

  // Fetch first question when module starts
  useEffect(() => {
    if (currentModule && !currentQuestion && !isComplete && !isLoading) {
      fetchQuestion();
    }
  }, [currentModule, currentQuestion, isComplete, isLoading, fetchQuestion]);

  // Handle session completion
  useEffect(() => {
    if (isComplete && currentModule) {
      completeModule();
      // If both modules done, go to results
      if (completedModules.length + 1 >= 2) {
        router.push("/results");
      }
    }
  }, [isComplete, currentModule, completeModule, completedModules.length, router]);

  const handleSelectModule = (module: Module) => {
    startModule(module);
  };

  const handleAnswer = (selectedIndex: number) => {
    recordAnswer(selectedIndex);

    // After recording, fetch the next question (with delay for feedback)
    if (totalAnswered + 1 < 20) {
      setTimeout(() => {
        fetchQuestion();
      }, 1300);
    }
  };

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
  if (isLoading && !currentQuestion) {
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
  if (currentQuestion) {
    return (
      <QuestionCard
        question={currentQuestion}
        questionNumber={totalAnswered + 1}
        totalQuestions={20}
        onAnswer={handleAnswer}
      />
    );
  }

  return null;
}
