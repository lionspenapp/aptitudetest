import { create } from "zustand";
import type {
  CurriculumProfile,
  CurriculumUnit,
  EvaluationTier,
  ExamFormat,
  KnowledgePillar,
  ProblemScenario,
  SessionMaterial,
  SessionProgress,
  SpacedPhase,
  StudySession,
  SubscriptionTier,
} from "@/types/database";

export interface PillarDiagnostic {
  pillar_num: number;
  concept: string;
  reason?: string;
  gap?: string;
  missing?: string;
  tier: EvaluationTier;
}

export interface EvaluationResult {
  green: PillarDiagnostic[];
  yellow: PillarDiagnostic[];
  red: PillarDiagnostic[];
}

interface InscribeState {
  /* Auth & subscription */
  userId: string | null;
  subscriptionTier: SubscriptionTier;

  /* Setup config */
  selectedProfile: CurriculumProfile | null;
  selectedUnit: CurriculumUnit | null;
  questionCount: number;
  examFormat: ExamFormat;
  examTimestamp: string;

  /* Active session */
  session: StudySession | null;
  materials: SessionMaterial | null;
  pillars: KnowledgePillar[];
  progress: SessionProgress | null;

  /* Timer */
  phaseRemainingSeconds: number;

  /* Sandbox */
  canvasText: string;
  lastHint: string | null;

  /* Diagnostics */
  evaluation: EvaluationResult | null;
  recoveryDeck: KnowledgePillar[];
  notYetPile: KnowledgePillar[];

  /* Actions */
  setUser: (userId: string | null, tier?: SubscriptionTier) => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  setSetupConfig: (config: {
    profile: CurriculumProfile;
    unit: CurriculumUnit;
    questionCount: number;
    examFormat: ExamFormat;
    examTimestamp: string;
  }) => void;
  setSession: (session: StudySession) => void;
  setMaterials: (materials: SessionMaterial) => void;
  setPillars: (pillars: KnowledgePillar[]) => void;
  setProgress: (progress: SessionProgress) => void;
  setPhaseRemaining: (seconds: number) => void;
  setCanvasText: (text: string) => void;
  setLastHint: (hint: string | null) => void;
  setEvaluation: (result: EvaluationResult) => void;
  initRecoveryDeck: (pillars: KnowledgePillar[]) => void;
  markKnowIt: (pillarId: string) => void;
  reset: () => void;
}

const initialState = {
  userId: null as string | null,
  subscriptionTier: "free" as SubscriptionTier,
  selectedProfile: null as CurriculumProfile | null,
  selectedUnit: null as CurriculumUnit | null,
  questionCount: 25,
  examFormat: "multiple_choice" as ExamFormat,
  examTimestamp: "",
  session: null as StudySession | null,
  materials: null as SessionMaterial | null,
  pillars: [] as KnowledgePillar[],
  progress: null as SessionProgress | null,
  phaseRemainingSeconds: 0,
  canvasText: "",
  lastHint: null as string | null,
  evaluation: null as EvaluationResult | null,
  recoveryDeck: [] as KnowledgePillar[],
  notYetPile: [] as KnowledgePillar[],
};

export const useInscribeStore = create<InscribeState>((set) => ({
  ...initialState,

  setUser: (userId, tier = "free") =>
    set({ userId, subscriptionTier: tier }),

  setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),

  setSetupConfig: (config) =>
    set({
      selectedProfile: config.profile,
      selectedUnit: config.unit,
      questionCount: config.questionCount,
      examFormat: config.examFormat,
      examTimestamp: config.examTimestamp,
    }),

  setSession: (session) => set({ session }),
  setMaterials: (materials) => set({ materials }),
  setPillars: (pillars) => set({ pillars }),
  setProgress: (progress) => set({ progress }),
  setPhaseRemaining: (seconds) => set({ phaseRemainingSeconds: seconds }),
  setCanvasText: (text) => set({ canvasText: text }),
  setLastHint: (hint) => set({ lastHint: hint }),

  setEvaluation: (result) => set({ evaluation: result }),

  initRecoveryDeck: (pillars) => {
    const needsRecovery = pillars.filter(
      (p) => p.evaluation_tier === "yellow" || p.evaluation_tier === "red"
    );
    set({ recoveryDeck: needsRecovery, notYetPile: [...needsRecovery] });
  },

  markKnowIt: (pillarId) =>
    set((state) => ({
      notYetPile: state.notYetPile.filter((p) => p.id !== pillarId),
    })),

  reset: () => set(initialState),
}));

export type { ProblemScenario, SpacedPhase };
