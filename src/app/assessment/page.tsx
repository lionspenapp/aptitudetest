"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModuleMenu from "@/components/ModuleMenu";
import QuestionCard from "@/components/QuestionCard";
import { useAssessmentStore } from "@/store/assessment-store";
import type { Module, Question } from "@/types/database";

export default function AssessmentPage() {
  const router = useRouter();
  const {
    studentName,
    enrolledGrade,
    currentModule,
    currentTier,
    usedQuestionIds,
    totalAnswered,
    isComplete,
    completedModules,
    startModule,
    setCurrentQuestion,
    recordAnswer,
    completeModule,
  } = useAssessmentStore();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsFetch, setNeedsFetch] = useState(false);

  // Redirect to setup if no student name
  useEffect(() => {
    if (!studentName) {
      router.push("/");
    }
  }, [studentName, router]);

  // Trigger fetch when module starts
  useEffect(() => {
    if (currentModule && !question && !loading) {
      setNeedsFetch(true);
    }
  }, [currentModule, question, loading]);

  // Fetch question when needed
  useEffect(() => {
    if (!needsFetch || !currentModule || isComplete) return;

    setNeedsFetch(false);
    setLoading(true);

    fetch("/api/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentModule,
        currentTier,
        usedIds: usedQuestionIds,
      }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.question) {
          setQuestion(data.question);
          setCurrentQuestion(data.question);
        } else {
          // No more questions — end module
          handleModuleComplete();
        }
      })
      .catch((err) => {
        console.error("Failed to fetch question:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [needsFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle session completion
  useEffect(() => {
    if (isComplete && currentModule) {
      handleModuleComplete();
    }
  }, [isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleModuleComplete() {
    completeModule();
    setQuestion(null);
    // If both modules done, go to results
    if (completedModules.length + 1 >= 2) {
      router.push("/results");
    }
  }

  const handleSelectModule = (module: Module) => {
    setQuestion(null);
    startModule(module);
    setNeedsFetch(true);
  };

  const handleAnswer = (selectedIndex: number) => {
    recordAnswer(selectedIndex);

    // Clear current question and fetch next after feedback delay
    setTimeout(() => {
      setQuestion(null);
      setNeedsFetch(true);
    }, 1300);
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
