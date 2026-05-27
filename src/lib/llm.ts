import {
  MaterialGeneratorSchema,
  EvaluationResultSchema,
  StuckHintSchema,
} from "@/lib/schemas/material-generator";

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const braceStart = trimmed.indexOf("{");
  const braceEnd = trimmed.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    return trimmed.slice(braceStart, braceEnd + 1);
  }
  return trimmed;
}

export async function callAnthropicJson<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt + "\n\nRespond with ONLY a raw JSON object. No markdown, no prose.",
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${errText}`);
  }

  const data = await response.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const jsonStr = extractJson(text);
  const parsed = JSON.parse(jsonStr);
  return schema.parse(parsed);
}

export function buildMaterialGeneratorPrompt(params: {
  courseLevel: string;
  topicTitle: string;
  questionCount: number;
  examFormat: string;
}): { system: string; user: string } {
  const depthCalibration =
    params.examFormat === "multiple_choice"
      ? "Configure pillars around precise definitions, location matches, and discrete causal structures."
      : "Configure pillars around multi-part linear mechanisms, system stress tests, and cascading biological disruptions.";

  const system = `You are a world-class instructional designer specializing in Cognitive Psychology, Neurobiology, and standard national educational curriculums.
The student is preparing for an exam with the following strict constraints:
- Course Level: ${params.courseLevel}
- Unit Topic: ${params.topicTitle}
- Exam Size: ${params.questionCount} Questions
- Format: ${params.examFormat}

DEPTH CALIBRATION: ${depthCalibration}

TASK:
1. Determine exactly ${params.questionCount} distinct core "Knowledge Pillars" that have the absolute highest probability of being tested on an exam of this scope under national standards.
2. Structure these pillars cleanly across three highly specific, optimized study input materials that match a 20-10-20-10-20 spaced learning block format.

OUTPUT SCHEMA EXPECTATIONS:
You must respond with an absolutely clean, un-wrapped JSON object adhering exactly to the following properties. Do not include markdown blocks, text wrappers, or conversational prose.
{
  "pillars": [{"num": 1, "name": "Concept Name / Anchor Term"}],
  "text_module": "Markdown string containing high-density bulleted facts for the pillars. No filler text.",
  "graphic_module_svg": "Clean, inline, self-contained SVG responsive code string visualizing the mechanical cycles or an explicit Mermaid.js diagram string using the theme colors (lapis blue #1A237E, slate #2B2D42, warm gold #D4AF37).",
  "problem_solving": [{"scenario": "A specific system mutation, failure, or laboratory experiment scenario.", "questions": ["Question 1 evaluating downstream dependencies", "Question 2 evaluating variables"]}]
}`;

  return { system, user: "Generate the study materials now." };
}

export function buildEvaluationPrompt(params: {
  pillars: { num: number; name: string }[];
  rawCanvasDump: string;
}): { system: string; user: string } {
  const system = `You are a strict, expert diagnostic examination processor. Your role is to perform a detailed gap analysis on a student's un-cued stream-of-consciousness brain dump against an explicitly defined list of national curriculum Knowledge Pillars.

EVALUATION PARAMETERS:
- 'green': The concept was explicitly recalled with accurate logical mechanics and terminology.
- 'yellow': The concept was mentioned, but contains major gaps, is missing critical structural keywords, or displays hazy structural logic.
- 'red': The concept was completely missing or forgotten in the student's un-cued retrieval stream.

OUTPUT SCHEMA EXPECTATIONS:
Return strictly a raw JSON object matching the following format with zero additional context.
{
  "green": [{"pillar_num": 1, "concept": "string", "reason": "string"}],
  "yellow": [{"pillar_num": 2, "concept": "string", "gap": "string"}],
  "red": [{"pillar_num": 3, "concept": "string", "missing": "string"}]
}`;

  const user = `Target Pillars to Match: ${JSON.stringify(params.pillars)}

Student's Unrefined Brain Dump Text: ${params.rawCanvasDump}`;

  return { system, user };
}

export function buildStuckHintPrompt(params: {
  pillars: { num: number; name: string }[];
  canvasText: string;
}): { system: string; user: string } {
  const system = `You are a Socratic study coach. Analyze the student's current brain dump transcript and identify which Knowledge Pillars are completely missing or underdeveloped.

STRICT CONSTRAINTS:
- Output ONLY a single-sentence contextual hint or anchor question.
- NEVER provide answers, definitions, or direct corrections.
- Only provide directional cues that prompt retrieval.

Respond with JSON: {"hint": "your single sentence hint here"}`;

  const user = `Knowledge Pillars: ${JSON.stringify(params.pillars)}

Current Transcript: ${params.canvasText || "(empty)"}`;

  return { system, user };
}

export async function generateMaterials(params: {
  courseLevel: string;
  topicTitle: string;
  questionCount: number;
  examFormat: string;
}) {
  const { system, user } = buildMaterialGeneratorPrompt(params);
  return callAnthropicJson(system, user, MaterialGeneratorSchema);
}

export async function evaluateDump(params: {
  pillars: { num: number; name: string }[];
  rawCanvasDump: string;
}) {
  const { system, user } = buildEvaluationPrompt(params);
  return callAnthropicJson(system, user, EvaluationResultSchema);
}

export async function generateStuckHint(params: {
  pillars: { num: number; name: string }[];
  canvasText: string;
}) {
  const { system, user } = buildStuckHintPrompt(params);
  return callAnthropicJson(system, user, StuckHintSchema);
}

export function getMockMaterials(params: {
  courseLevel: string;
  topicTitle: string;
  questionCount: number;
  examFormat: string;
}) {
  const pillars = Array.from({ length: params.questionCount }, (_, i) => ({
    num: i + 1,
    name: `${params.topicTitle} Concept ${i + 1}`,
  }));

  return MaterialGeneratorSchema.parse({
    pillars,
    text_module: `# ${params.topicTitle} — Essential Knowledge\n\n${pillars.map((p) => `- **${p.name}**: Key fact about ${p.name.toLowerCase()} relevant to ${params.examFormat} format exams.`).join("\n")}`,
    graphic_module_svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="#F5F0E8" width="400" height="200"/><circle cx="100" cy="100" r="40" fill="#1A237E"/><circle cx="200" cy="100" r="40" fill="#D4AF37"/><circle cx="300" cy="100" r="40" fill="#2B2D42"/><text x="200" y="180" text-anchor="middle" fill="#1A237E" font-size="14">${params.topicTitle} Cycle</text></svg>`,
    problem_solving: [
      {
        scenario: `A laboratory experiment disrupts a key process in ${params.topicTitle}.`,
        questions: [
          "What downstream effect would you predict?",
          "Which variable would you control in a follow-up experiment?",
        ],
      },
      {
        scenario: `A mutation affects structural integrity within ${params.topicTitle}.`,
        questions: [
          "Describe the cascading biological disruption.",
          "How would this appear in diagnostic data?",
        ],
      },
    ],
  });
}

export function getMockEvaluation(pillars: { num: number; name: string }[], canvasText: string) {
  const mentioned = pillars.filter((p) =>
    canvasText.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
  );
  const green = mentioned.slice(0, Math.ceil(mentioned.length / 2)).map((p) => ({
    pillar_num: p.num,
    concept: p.name,
    reason: "Accurately recalled with correct terminology.",
  }));
  const yellow = mentioned.slice(Math.ceil(mentioned.length / 2)).map((p) => ({
    pillar_num: p.num,
    concept: p.name,
    gap: "Mentioned but missing critical structural keywords.",
  }));
  const red = pillars
    .filter((p) => !mentioned.find((m) => m.num === p.num))
    .map((p) => ({
      pillar_num: p.num,
      concept: p.name,
      missing: "Completely omitted from retrieval stream.",
    }));

  return EvaluationResultSchema.parse({ green, yellow, red });
}

export function getMockStuckHint(pillars: { num: number; name: string }[]) {
  const random = pillars[Math.floor(Math.random() * pillars.length)];
  return StuckHintSchema.parse({
    hint: `You've covered several concepts — but can you explain how ${random.name} connects to the broader system?`,
  });
}
