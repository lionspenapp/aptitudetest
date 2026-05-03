import type { Question, QuestionType } from "@/types/database";

/**
 * Pick a question from candidates, preferring types that have not appeared
 * in the trailing window `recentTypes` (typically the last 6 questions).
 * Used server-side by /api/next-question — stays free of any Supabase import
 * so client bundles that only need tier math never pull in the browser client.
 */
export function pickDiverseQuestion(
  candidates: Question[],
  recentTypes: QuestionType[]
): Question | null {
  if (candidates.length === 0) return null;

  const window = recentTypes.slice(-6);
  const typeFrequency = new Map<string, number>();
  for (const t of window) {
    typeFrequency.set(t, (typeFrequency.get(t) ?? 0) + 1);
  }

  let minFreq = Infinity;
  const buckets = new Map<number, Question[]>();
  for (const c of candidates) {
    const freq = typeFrequency.get(c.type) ?? 0;
    if (freq < minFreq) minFreq = freq;
    const bucket = buckets.get(freq) ?? [];
    bucket.push(c);
    buckets.set(freq, bucket);
  }

  const preferred = buckets.get(minFreq) ?? candidates;
  return preferred[Math.floor(Math.random() * preferred.length)];
}
