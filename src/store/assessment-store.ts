import { create } from "zustand";
import type {
  Module,
  Tier,
  Question,
  QuestionType,
  PercentileBand,
  PartNumber,
} from "@/types/database";
import {
  adjustTier,
  getStartingTier,
  QUESTIONS_PER_SESSION,
  PARTS_PER_MODULE,
} from "@/lib/adaptive";
import { scoreModule, type ScoringAnswer } from "@/lib/scoring";

interface PartState {
  completed: boolean;
  tierHistory: Tier[];
  answers: ScoringAnswer[];
}

type ModuleSessions = Record<PartNumber, PartState>;

const emptyPart = (): PartState => ({
  completed: false,
  tierHistory: [],
  answers: [],
});

const emptyModuleSessions = (): ModuleSessions => ({
  1: emptyPart(),
  2: emptyPart(),
});

export interface ModuleResult {
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

  /* Active sitting (one part at a time) */
  currentModule: Module | null;
  currentPart: PartNumber | null;
  currentTier: Tier;
  currentQuestion: Question | null;
  totalAnswered: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  isPartComplete: boolean;
  isLoading: boolean;

  /* Per-module persistence (across both parts) */
  usedQuestionIdsByModule: Record<Module, string[]>;
  sessions: Record<Module, ModuleSessions>;

  /* Final per-module aggregated results (set when both parts of a module are done) */
  moduleResults: ModuleResult[];

  /* Actions */
  setStudent: (name: string, grade: number) => void;
  startPart: (module: Module, part: PartNumber) => void;
  setCurrentQuestion: (question: Question) => void;
  setLoading: (loading: boolean) => void;
  recordAnswer: (selectedIndex: number) => void;
  completePart: () => ModuleResult | null;
  reset: () => void;

  /* Selectors / helpers */
  isPartUnlocked: (module: Module, part: PartNumber) => boolean;
  isPartDone: (module: Module, part: PartNumber) => boolean;
  allPartsCompleted: () => boolean;
}

const INITIAL_STATE = {
  studentName: "",
  enrolledGrade: 5,

  currentModule: null as Module | null,
  currentPart: null as PartNumber | null,
  currentTier: 2 as Tier,
  currentQuestion: null as Question | null,
  totalAnswered: 0,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 0,
  isPartComplete: false,
  isLoading: false,

  usedQuestionIdsByModule: {
    quantitative: [] as string[],
    verbal: [] as string[],
  } as Record<Module, string[]>,

  sessions: {
    quantitative: emptyModuleSessions(),
    verbal: emptyModuleSessions(),
  } as Record<Module, ModuleSessions>,

  moduleResults: [] as ModuleResult[],
};

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  ...INITIAL_STATE,

  setStudent: (name, grade) =>
    set({ studentName: name, enrolledGrade: grade }),

  startPart: (module, part) => {
    const state = get();

    if (part === 2 && !state.sessions[module][1].completed) {
      console.warn(
        `Cannot start ${module} Part 2 — Part 1 is not yet complete.`
      );
      return;
    }
    if (state.sessions[module][part].completed) {
      console.warn(
        `Cannot restart ${module} Part ${part} — already completed.`
      );
      return;
    }

    const startingTier = getStartingTier(state.enrolledGrade);

    const updatedSessions: Record<Module, ModuleSessions> = {
      ...state.sessions,
      [module]: {
        ...state.sessions[module],
        [part]: {
          completed: false,
          tierHistory: [startingTier],
          answers: [],
        },
      },
    };

    set({
      currentModule: module,
      currentPart: part,
      currentTier: startingTier,
      currentQuestion: null,
      totalAnswered: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      isPartComplete: false,
      isLoading: false,
      sessions: updatedSessions,
    });
  },

  setCurrentQuestion: (question) =>
    set((state) => {
      if (!state.currentModule) return state;
      return {
        currentQuestion: question,
        usedQuestionIdsByModule: {
          ...state.usedQuestionIdsByModule,
          [state.currentModule]: [
            ...state.usedQuestionIdsByModule[state.currentModule],
            question.id,
          ],
        },
      };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  recordAnswer: (selectedIndex) =>
    set((state) => {
      const question = state.currentQuestion;
      const mod = state.currentModule;
      const part = state.currentPart;
      if (!question || !mod || !part) return state;

      const isCorrect = selectedIndex === question.correct_answer;
      const totalAnswered = state.totalAnswered + 1;

      const newConsecutiveCorrect = isCorrect
        ? state.consecutiveCorrect + 1
        : 0;
      const newConsecutiveIncorrect = isCorrect
        ? 0
        : state.consecutiveIncorrect + 1;

      const { newTier, shouldEnd, resetCorrect, resetIncorrect } = adjustTier(
        state.currentTier,
        newConsecutiveCorrect,
        newConsecutiveIncorrect
      );

      const partState = state.sessions[mod][part];
      const updatedAnswers: ScoringAnswer[] = [
        ...partState.answers,
        {
          type: question.type,
          correct: isCorrect,
          difficulty_weight: question.difficulty_weight,
        },
      ];
      const updatedTierHistory: Tier[] = [...partState.tierHistory, newTier];

      const isPartComplete =
        shouldEnd || totalAnswered >= QUESTIONS_PER_SESSION;

      return {
        totalAnswered,
        currentTier: newTier,
        consecutiveCorrect: resetCorrect ? 0 : newConsecutiveCorrect,
        consecutiveIncorrect: resetIncorrect ? 0 : newConsecutiveIncorrect,
        isPartComplete,
        sessions: {
          ...state.sessions,
          [mod]: {
            ...state.sessions[mod],
            [part]: {
              ...partState,
              answers: updatedAnswers,
              tierHistory: updatedTierHistory,
            },
          },
        },
      };
    }),

  completePart: () => {
    const state = get();
    const mod = state.currentModule;
    const part = state.currentPart;
    if (!mod || !part) return null;

    const updatedSessions: Record<Module, ModuleSessions> = {
      ...state.sessions,
      [mod]: {
        ...state.sessions[mod],
        [part]: {
          ...state.sessions[mod][part],
          completed: true,
        },
      },
    };

    let moduleResults = state.moduleResults;

    const bothPartsDone =
      updatedSessions[mod][1].completed &&
      updatedSessions[mod][2].completed;

    if (bothPartsDone && !moduleResults.some((r) => r.module === mod)) {
      const part1 = updatedSessions[mod][1];
      const part2 = updatedSessions[mod][2];

      const result = scoreModule({
        enrolledGrade: state.enrolledGrade,
        module: mod,
        part1Answers: part1.answers,
        part2Answers: part2.answers,
        part1TierHistory: part1.tierHistory,
        part2TierHistory: part2.tierHistory,
      });

      moduleResults = [...moduleResults, { ...result, module: mod }];
    }

    set({
      sessions: updatedSessions,
      moduleResults,
      currentModule: null,
      currentPart: null,
      currentQuestion: null,
      totalAnswered: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      isPartComplete: false,
    });

    return moduleResults.find((r) => r.module === mod) ?? null;
  },

  reset: () => set({ ...INITIAL_STATE,
    usedQuestionIdsByModule: { quantitative: [], verbal: [] },
    sessions: {
      quantitative: emptyModuleSessions(),
      verbal: emptyModuleSessions(),
    },
    moduleResults: [],
  }),

  isPartUnlocked: (module, part) => {
    if (part === 1) return true;
    return get().sessions[module][1].completed;
  },

  isPartDone: (module, part) => get().sessions[module][part].completed,

  allPartsCompleted: () => {
    const { sessions } = get();
    const modules: Module[] = ["quantitative", "verbal"];
    return modules.every((m) =>
      ([1, 2] as PartNumber[]).every((p) => sessions[m][p].completed)
    );
  },
}));

export { QUESTIONS_PER_SESSION, PARTS_PER_MODULE };
