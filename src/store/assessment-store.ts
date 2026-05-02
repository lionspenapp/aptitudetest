import { create } from "zustand";
import type { Module, Tier, Question } from "@/types/database";

interface AssessmentState {
  /** Current module being taken */
  currentModule: Module | null;
  /** Current adaptive tier */
  currentTier: Tier;
  /** IDs of questions already shown (prevents repeats) */
  usedQuestionIds: string[];
  /** Questions answered correctly (for GE calculation) */
  correctAnswers: { questionId: string; difficultyWeight: number }[];
  /** Total questions answered */
  totalAnswered: number;
  /** Consecutive correct count (for level-up logic) */
  consecutiveCorrect: number;
  /** Consecutive incorrect count (for level-down logic) */
  consecutiveIncorrect: number;
  /** The current question being displayed */
  currentQuestion: Question | null;
  /** Whether the session is complete */
  isComplete: boolean;

  /** Actions */
  startSession: (module: Module, startingTier: Tier) => void;
  setCurrentQuestion: (question: Question) => void;
  recordAnswer: (isCorrect: boolean, difficultyWeight: number) => void;
  endSession: () => void;
  reset: () => void;
}

const QUESTIONS_PER_SESSION = 20;

export const useAssessmentStore = create<AssessmentState>((set) => ({
  currentModule: null,
  currentTier: 1,
  usedQuestionIds: [],
  correctAnswers: [],
  totalAnswered: 0,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 0,
  currentQuestion: null,
  isComplete: false,

  startSession: (module, startingTier) =>
    set({
      currentModule: module,
      currentTier: startingTier,
      usedQuestionIds: [],
      correctAnswers: [],
      totalAnswered: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      currentQuestion: null,
      isComplete: false,
    }),

  setCurrentQuestion: (question) =>
    set((state) => ({
      currentQuestion: question,
      usedQuestionIds: [...state.usedQuestionIds, question.id],
    })),

  recordAnswer: (isCorrect, difficultyWeight) =>
    set((state) => {
      const totalAnswered = state.totalAnswered + 1;
      const correctAnswers = isCorrect
        ? [
            ...state.correctAnswers,
            {
              questionId: state.currentQuestion?.id ?? "",
              difficultyWeight,
            },
          ]
        : state.correctAnswers;

      let consecutiveCorrect = isCorrect ? state.consecutiveCorrect + 1 : 0;
      let consecutiveIncorrect = isCorrect
        ? 0
        : state.consecutiveIncorrect + 1;
      let currentTier = state.currentTier;

      // Adaptive branching: 3 correct → level up, 2 incorrect → level down
      if (consecutiveCorrect >= 3 && currentTier < 4) {
        currentTier = (currentTier + 1) as Tier;
        consecutiveCorrect = 0;
      }
      if (consecutiveIncorrect >= 2 && currentTier > 1) {
        currentTier = (currentTier - 1) as Tier;
        consecutiveIncorrect = 0;
      }

      const isComplete =
        totalAnswered >= QUESTIONS_PER_SESSION ||
        (consecutiveIncorrect >= 2 && currentTier === 1) ||
        (consecutiveCorrect >= 3 && currentTier === 4);

      return {
        correctAnswers,
        totalAnswered,
        consecutiveCorrect,
        consecutiveIncorrect,
        currentTier,
        isComplete,
      };
    }),

  endSession: () => set({ isComplete: true }),

  reset: () =>
    set({
      currentModule: null,
      currentTier: 1,
      usedQuestionIds: [],
      correctAnswers: [],
      totalAnswered: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      currentQuestion: null,
      isComplete: false,
    }),
}));
