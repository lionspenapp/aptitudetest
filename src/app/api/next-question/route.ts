import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { NIL_UUID } from "@/lib/adaptive";

/**
 * POST /api/next-question
 *
 * Fetches the next adaptive question from Supabase based on:
 * - currentModule ("quantitative" | "verbal")
 * - currentTier (1 | 2 | 3 | 4)
 * - usedIds (array of already-shown question UUIDs across the *full module*,
 *   so Part 2 never repeats Part 1's questions)
 *
 * Excludes already-used IDs using a sentinel UUID when the list is empty so
 * the Postgrest `not in` clause is always well-formed:
 *
 *   .not('id', 'in', `(${usedIds.length > 0 ? usedIds.join(',') : NIL_UUID})`)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentModule, currentTier, usedIds = [] } = body as {
      currentModule?: string;
      currentTier?: number;
      usedIds?: string[];
    };

    if (!currentModule || !currentTier) {
      return NextResponse.json(
        { error: "Missing required fields: currentModule, currentTier" },
        { status: 400 }
      );
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const excludedIds = `(${usedIds.length > 0 ? usedIds.join(",") : NIL_UUID})`;

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("module", currentModule)
      .eq("tier", currentTier)
      .not("id", "in", excludedIds)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: "No questions available",
          details: error?.message ?? "Pool exhausted for this tier",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ question: data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch question", details: String(err) },
      { status: 500 }
    );
  }
}
