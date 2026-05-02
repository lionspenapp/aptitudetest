import { create } from "zustand";
import type { Module, Tier, Question, QuestionType, PercentileBand } from "@/types/database";
import { adjustTier, getStartingTier } from "@/lib/adaptive";
import {
  calculateGEScore,
  getPercentileBand,
  calculateGrowthGap,
  identifyWeakTypes,
  getHighestTierReached,
} from "@/lib/scoring";

interface ModuleResult {
  module: Module;
  rawScore: number;
  totalQuestions: number;
  geScore: number;
  percentileBand: PercentileBand;
  growthGap: number;
  tierReached: Tier;
  strongTypes: QuestionType[];
  weakTypes: QuestionType[];
}

interface AssessmentState {
  /* Student info */
  studentName: string;
  enrolledGrade: number;

  /* Session state */
  currentModule: Module | null;
  currentTier: Tier;
  usedQuestionIds: string[];
  currentQuestion: Question | null;
  totalAnswered: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  isComplete: boolean;
  isLoading: boolean;

  /* Answer tracking for scoring */
  correctDifficultyWeights: number[];
  tierHistory: Tier[];
  answers: { type: QuestionType; correct: boolean }[];

  /* Completed module results */
  completedModules: Module[];
  results: ModuleResult[];

  /* Actions */
  setStudent: (name: string, grade: number) => void;
  startModule: (module: Module) => void;
  setCurrentQuestion: (question: Question) => void;
  setLoading: (loading: boolean) => void;
  recordAnswer: (selectedIndex: number) => void;
  completeModule: () => void;
  reset: () => void;
}

const QUESTIONS_PER_SESSION = 20;

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  studentName: "",
  enrolledGrade: 5,

  currentModule: null,
  currentTier: 2,
  usedQuestionIds: [],
  currentQuestion: null,
  totalAnswered: 0,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 0,
  isComplete: false,
  isLoading: false,

  correctDifficultyWeights: [],
  tierHistory: [],
  answers: [],

  completedModules: [],
  results: [],

  setStudent: (name, grade) =>
    set({ studentName: name, enrolledGrade: grade }),

  startModule: (module) => {
    const grade = get().enrolledGrade;
    const startingTier = getStartingTier(grade);
    set({
      currentModule: module,
      currentTier: startingTier,
      usedQuestionIds: [],
      currentQuestion: null,
      totalAnswered: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      isComplete: false,
      isLoading: false,
      correctDifficultyWeights: [],
      tierHistory: [startingTier],
      answers: [],
    });
  },

  setCurrentQuestion: (question) =>
    set((state) => ({
      currentQuestion: question,
      usedQuestionIds: [...state.usedQuestionIds, question.id],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  recordAnswer: (selectedIndex) =>
    set((state) => {
      const question = state.currentQuestion;
      if (!question) return state;

      const isCorrect = selectedIndex === question.correct_answer;
      const totalAnswered = state.totalAnswered + 1;

      const correctDifficultyWeights = isCorrect
        ? [...state.correctDifficultyWeights, question.difficulty_weight]
        : state.correctDifficultyWeights;

      const newConsecutiveCorrect = isCorrect
        ? state.consecutiveCorrect + 1
        : 0;
      const newConsecutiveIncorrect = isCorrect
        ? 0
        : state.consecutiveIncorrect + 1;

      const answers = [
        ...state.answers,
        { type: question.type, correct: isCorrect },
      ];

      // Apply adaptive branching logic
      const { newTier, shouldEnd, resetCorrect, resetIncorrect } = adjustTier(
        state.currentTier,
        newConsecutiveCorrect,
        newConsecutiveIncorrect
      );

      const tierHistory = [...state.tierHistory, newTier];

      const isComplete =
        shouldEnd || totalAnswered >= QUESTIONS_PER_SESSION;

      return {
        totalAnswered,
        correctDifficultyWeights,
        consecutiveCorrect: resetCorrect ? 0 : newConsecutiveCorrect,
        consecutiveIncorrect: resetIncorrect ? 0 : newConsecutiveIncorrect,
        currentTier: newTier,
        tierHistory,
        answers,
        isComplete,
      };
    }),

  completeModule: () =>
    set((state) => {
      const rawScore = state.correctDifficultyWeights.length;
      const totalQuestions = state.totalAnswered;
      const geScore = calculateGEScore(state.correctDifficultyWeights);
      const percentileBand = getPercentileBand(rawScore, totalQuestions);
      const growthGap = calculateGrowthGap(geScore, state.enrolledGrade);
      const tierReached = getHighestTierReached(state.tierHistory);
      const weakTypes = identifyWeakTypes(state.answers);

      // Strong types = types where ≥75% correct
      const typeStats: Record<string, { total: number; correct: number }> = {};
      for (const a of state.answers) {
        if (!typeStats[a.type]) typeStats[a.type] = { total: 0, correct: 0 };
        typeStats[a.type].total++;
        if (a.correct) typeStats[a.type].correct++;
      }
      const strongTypes: QuestionType[] = [];
      for (const [type, stats] of Object.entries(typeStats)) {
        if (stats.correct / stats.total >= 0.75) {
          strongTypes.push(type as QuestionType);
        }
      }

      const result: ModuleResult = {
        module: state.currentModule!,
        rawScore,
        totalQuestions,
        geScore,
        percentileBand,
        growthGap,
        tierReached,
        strongTypes,
        weakTypes,
      };

      return {
        completedModules: [...state.completedModules, state.currentModule!],
        results: [...state.results, result],
        currentModule: null,
        currentQuestion: null,
      };
    }),

  reset: () =>
    set({
      studentName: "",
      enrolledGrade: 5,
      currentModule: null,
      currentTier: 2,
      usedQuestionIds: [],
      currentQuestion: null,
      totalAnswered: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      isComplete: false,
      isLoading: false,
      correctDifficultyWeights: [],
      tierHistory: [],
      answers: [],
      completedModules: [],
      results: [],
    }),
}));
