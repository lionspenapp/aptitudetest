import type { SpacedPhase } from "@/types/database";

export const PHASE_SEQUENCE: SpacedPhase[] = [
  "block1_text",
  "distractor1",
  "block2_graphic",
  "distractor2",
  "block3_problems",
  "complete",
];

const PRODUCTION_DURATIONS: Record<SpacedPhase, number> = {
  block1_text: 1200,
  distractor1: 600,
  block2_graphic: 1200,
  distractor2: 600,
  block3_problems: 1200,
  complete: 0,
};

const DEV_DURATIONS: Record<SpacedPhase, number> = {
  block1_text: 10,
  distractor1: 5,
  block2_graphic: 10,
  distractor2: 5,
  block3_problems: 10,
  complete: 0,
};

export function getPhaseDuration(phase: SpacedPhase): number {
  const useDev = process.env.NEXT_PUBLIC_INSCRIBE_DEV_TIMERS === "true";
  return useDev ? DEV_DURATIONS[phase] : PRODUCTION_DURATIONS[phase];
}

export function getNextPhase(current: SpacedPhase): SpacedPhase {
  const idx = PHASE_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= PHASE_SEQUENCE.length - 1) return "complete";
  return PHASE_SEQUENCE[idx + 1];
}

export function isDistractorPhase(phase: SpacedPhase): boolean {
  return phase === "distractor1" || phase === "distractor2";
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function getPhaseLabel(phase: SpacedPhase): string {
  switch (phase) {
    case "block1_text":
      return "Conceptual Text Input";
    case "distractor1":
    case "distractor2":
      return "Brain Cooling Break";
    case "block2_graphic":
      return "Graphical Vectors";
    case "block3_problems":
      return "Analytical Problems";
    case "complete":
      return "Spaced Learning Complete";
    default:
      return phase;
  }
}
