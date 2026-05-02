"use client";

import { useState } from "react";
import type { Question } from "@/types/database";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSelect = (index: number) => {
    if (hasSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || hasSubmitted) return;
    setHasSubmitted(true);

    setTimeout(() => {
      onAnswer(selectedOption, selectedOption === question.correct_answer);
      setSelectedOption(null);
      setHasSubmitted(false);
    }, 1200);
  };

  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0]">
      {/* Progress Bar */}
      <div className="w-full bg-[#1A2744]/10 h-2">
        <div
          className="h-full bg-[#B8892A] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-medium text-[#1A2744]/60">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="text-xs font-medium text-[#B8892A] bg-[#B8892A]/10 px-3 py-1 rounded-full capitalize">
          Tier {question.tier} · {question.type.replace("_", " ")}
        </span>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          {/* Passage (if reading comprehension) */}
          {question.passage && (
            <div className="mb-6 p-5 rounded-xl bg-white border border-[#1A2744]/10 max-h-48 overflow-y-auto">
              <p className="text-sm text-[#1A2744]/80 leading-relaxed italic">
                {question.passage}
              </p>
            </div>
          )}

          {/* Question Text */}
          <div className="bg-white rounded-2xl shadow-md border border-[#B8892A]/15 p-8 mb-8">
            <p className="text-lg font-medium text-[#1A2744] leading-relaxed">
              {question.question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => {
              let optionStyles = "border-[#1A2744]/12 bg-white hover:border-[#B8892A]/50";

              if (selectedOption === index && !hasSubmitted) {
                optionStyles = "border-[#B8892A] bg-[#B8892A]/5 ring-2 ring-[#B8892A]/20";
              }

              if (hasSubmitted) {
                if (index === question.correct_answer) {
                  optionStyles = "border-green-500 bg-green-50";
                } else if (
                  index === selectedOption &&
                  selectedOption !== question.correct_answer
                ) {
                  optionStyles = "border-red-400 bg-red-50";
                } else {
                  optionStyles = "border-[#1A2744]/8 bg-white/50 opacity-50";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelect(index)}
                  disabled={hasSubmitted}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${optionStyles}`}
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                      selectedOption === index
                        ? "bg-[#B8892A] text-white"
                        : "bg-[#1A2744]/8 text-[#1A2744]/60"
                    }`}
                  >
                    {OPTION_LETTERS[index]}
                  </span>
                  <span className="text-[#1A2744] text-left">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Submit / Feedback */}
          <div className="mt-8 flex justify-center">
            {!hasSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="px-10 py-3.5 rounded-xl bg-[#1A2744] text-white font-semibold shadow-md hover:bg-[#1A2744]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Submit Answer
              </button>
            ) : (
              <div
                className={`px-6 py-3 rounded-xl font-semibold text-center ${
                  selectedOption === question.correct_answer
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedOption === question.correct_answer
                  ? "✓ Correct!"
                  : `✗ Incorrect — Answer: ${OPTION_LETTERS[question.correct_answer]}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
