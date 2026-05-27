import { z } from "zod";

export const MaterialGeneratorSchema = z.object({
  pillars: z.array(
    z.object({
      num: z.number(),
      name: z.string(),
    })
  ),
  text_module: z.string(),
  graphic_module_svg: z.string(),
  problem_solving: z.array(
    z.object({
      scenario: z.string(),
      questions: z.array(z.string()),
    })
  ),
});

export type MaterialGeneratorOutput = z.infer<typeof MaterialGeneratorSchema>;

export const EvaluationResultSchema = z.object({
  green: z.array(
    z.object({
      pillar_num: z.number(),
      concept: z.string(),
      reason: z.string(),
    })
  ),
  yellow: z.array(
    z.object({
      pillar_num: z.number(),
      concept: z.string(),
      gap: z.string(),
    })
  ),
  red: z.array(
    z.object({
      pillar_num: z.number(),
      concept: z.string(),
      missing: z.string(),
    })
  ),
});

export type EvaluationResultOutput = z.infer<typeof EvaluationResultSchema>;

export const StuckHintSchema = z.object({
  hint: z.string(),
});

export type StuckHintOutput = z.infer<typeof StuckHintSchema>;
