import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * POST /api/next-question
 *
 * Fetches the next adaptive question from Supabase based on:
 * - currentModule ("quantitative" | "verbal")
 * - currentTier (1 | 2 | 3 | 4)
 * - usedIds (array of already-shown question UUIDs)
 *
 * Returns one random question from the matching pool, excluding used items.
 * This matches the Supabase fetch logic from the product plan:
 *
 * supabase.from("questions")
 *   .select("*")
 *   .eq("module", currentModule)
 *   .eq("tier", currentTier)
 *   .not("id", "in", usedIds)
 *   .order("random()")
 *   .limit(1)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentModule, currentTier, usedIds = [] } = body;

    if (!currentModule || !currentTier) {
      return NextResponse.json(
        { error: "Missing required fields: currentModule, currentTier" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component context — safe to ignore
            }
          },
        },
      }
    );

    let query = supabase
      .from("questions")
      .select("*")
      .eq("module", currentModule)
      .eq("tier", currentTier);

    // Exclude already-used questions (no repeats)
    if (usedIds.length > 0) {
      query = query.not("id", "in", `(${usedIds.join(",")})`);
    }

    // Fetch one random question from the filtered pool
    const { data, error } = await query.limit(1).single();

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
