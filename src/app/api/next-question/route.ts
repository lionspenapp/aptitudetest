import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Question } from "@/types/database";
import { NIL_UUID } from "@/lib/adaptive";

/**
 * POST /api/next-question
 *
 * Fetches the next adaptive question from Supabase based on:
 * - currentModule  ("quantitative" | "verbal")
 * - currentTier    (1 | 2 | 3 | 4)
 * - usedIds        (already-shown question UUIDs across the *full module*,
 *                   so Part 2 never repeats Part 1's questions)
 * - recentTypes    (optional — last few question types shown this part, used
 *                   to bias selection toward under-represented types so the
 *                   student doesn't see 5 analogies in a row)
 *
 * Excludes already-used IDs with a sentinel UUID when the list is empty so
 * the Postgrest `not in` clause is always well-formed:
 *
 *   .not('id', 'in', `(${usedIds.length > 0 ? usedIds.join(',') : NIL_UUID})`)
 *
 * Selection algorithm:
 *   1. Fetch all candidate questions matching (module, tier, not in usedIds).
 *      Tier pools are small (≤ ~100 rows) so this is cheap.
 *   2. Score each candidate's type by how many times it has appeared in
 *      `recentTypes`. Types not seen recently get the highest score.
 *   3. Filter to candidates whose type has the highest score, then pick one
 *      uniformly at random from that subset. This guarantees real variety
 *      while still keeping the choice within the right tier.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      currentModule,
      currentTier,
      usedIds = [],
      recentTypes = [],
    } = body as {
      currentModule?: string;
      currentTier?: number;
      usedIds?: string[];
      recentTypes?: string[];
    };

    if (!currentModule || !currentTier) {
      return NextResponse.json(
        { error: "Missing required fields: currentModule, currentTier" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const excludedIds = `(${usedIds.length > 0 ? usedIds.join(",") : NIL_UUID})`;

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("module", currentModule)
      .eq("tier", currentTier)
      .not("id", "in", excludedIds);

    const candidates = (data ?? []) as Question[];

    if (error || candidates.length === 0) {
      return NextResponse.json(
        {
          error: "No questions available",
          details: error?.message ?? "Pool exhausted for this tier",
        },
        { status: 404 }
      );
    }

    // Count how many times each type has been seen recently (window=6 keeps
    // us from penalising any one type forever).
    const window = recentTypes.slice(-6);
    const typeFrequency = new Map<string, number>();
    for (const t of window) {
      typeFrequency.set(t, (typeFrequency.get(t) ?? 0) + 1);
    }

    // Bucket candidates by their recent-frequency. Lowest frequency wins.
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
    const picked = preferred[Math.floor(Math.random() * preferred.length)];

    return NextResponse.json({ question: picked });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch question", details: String(err) },
      { status: 500 }
    );
  }
}
