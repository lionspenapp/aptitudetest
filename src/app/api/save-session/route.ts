import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PartNumber } from "@/types/database";

/**
 * POST /api/save-session
 *
 * Persists a single completed PART (one 20-question sitting) to the
 * `assessment_sessions` table. Each module records two rows per quarter,
 * distinguished by `part_number` (1 or 2).
 *
 * RLS on `assessment_sessions` requires `auth.uid() = student_id`, so an
 * unauthenticated insert will fail. We treat this endpoint as best-effort:
 * if the insert fails, we still return 200 with a warning so the UI flow
 * (assessment → results) is never blocked. The structured local report is
 * always produced from in-memory state regardless.
 */
export async function POST(request: NextRequest) {
  let body: {
    studentId?: string;
    quarter?: number;
    schoolYear?: string;
    module?: "quantitative" | "verbal";
    partNumber?: PartNumber;
    rawScore?: number;
    geScore?: number;
    percentileBand?: string;
    tierReached?: number;
    weakTypes?: string[];
  };

  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(err) },
      { status: 400 }
    );
  }

  const {
    studentId,
    quarter,
    schoolYear,
    module,
    partNumber,
    rawScore,
    geScore,
    percentileBand,
    tierReached,
    weakTypes,
  } = body;

  if (!module || !partNumber) {
    return NextResponse.json(
      { error: "Missing required fields: module, partNumber" },
      { status: 400 }
    );
  }

  if (!studentId) {
    return NextResponse.json({
      saved: false,
      warning:
        "No studentId provided — session not persisted. Local results remain available.",
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const payload = {
      student_id: studentId,
      quarter: quarter ?? 1,
      school_year: schoolYear ?? "",
      module,
      part_number: partNumber,
      raw_score: rawScore ?? 0,
      ge_score: geScore ?? 0,
      percentile_band: percentileBand ?? "Average",
      tier_reached: tierReached ?? 1,
      weak_types: weakTypes ?? [],
    };

    const { error } = await supabase
      .from("assessment_sessions")
      .insert(payload);

    if (error) {
      return NextResponse.json({
        saved: false,
        warning: `Insert blocked: ${error.message}`,
      });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    return NextResponse.json({
      saved: false,
      warning: `Persistence failed: ${String(err)}`,
    });
  }
}
