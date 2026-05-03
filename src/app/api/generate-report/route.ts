import { NextRequest, NextResponse } from "next/server";
import {
  generateCompositeReport,
  type ModuleReportData,
} from "@/lib/reportGenerator";

/**
 * POST /api/generate-report
 *
 * Builds the structured local report from scoring data, then attempts to
 * augment it with a Claude-generated narrative. The local report is the
 * primary deliverable — the narrative is an optional enhancement.
 *
 * - If ANTHROPIC_API_KEY is not configured, returns the local report with
 *   `narrative: null` (HTTP 200).
 * - If the Claude call fails, returns the local report with
 *   `narrative: null` and a `narrativeError` field (HTTP 200).
 *
 * ⚠ NEVER expose the Anthropic API key client-side.
 *
 * Request body:
 * {
 *   studentName: string,
 *   enrolledGrade: number,
 *   modules: ModuleReportData[]
 * }
 *
 * Response:
 * {
 *   report: CompositeReport,
 *   narrative: string | null,
 *   narrativeError?: string
 * }
 */
export async function POST(request: NextRequest) {
  let body: {
    studentName?: string;
    enrolledGrade?: number;
    modules?: ModuleReportData[];
  };

  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: String(err) },
      { status: 400 }
    );
  }

  const studentName = body.studentName ?? "Student";
  const enrolledGrade = body.enrolledGrade ?? 0;
  const modules = body.modules ?? [];

  const report = generateCompositeReport({
    studentName,
    enrolledGrade,
    modules,
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      report,
      narrative: null,
      narrativeError:
        "ANTHROPIC_API_KEY not configured — local report is complete without the narrative.",
    });
  }

  try {
    const strongTypes = report.composite?.strongTypes ?? [];
    const weakTypes = report.composite?.weakTypes ?? [];
    const compositeGE = report.composite?.geScore ?? null;
    const growthGap = report.composite?.growthGap ?? null;
    const quantitativeGE =
      modules.find((m) => m.module === "quantitative")?.geScore ?? null;
    const verbalGE =
      modules.find((m) => m.module === "verbal")?.geScore ?? null;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a school psychologist writing a quarterly assessment summary for a Lion's Pen student.
Write a 3-paragraph personalized narrative based on this scoring data:

Student: ${studentName}
Grade: ${enrolledGrade}
Quantitative GE: ${quantitativeGE ?? "N/A"}
Verbal GE: ${verbalGE ?? "N/A"}
Composite GE: ${compositeGE ?? "N/A"}
Growth Gap: ${growthGap ?? "N/A"}
Strengths: ${strongTypes.length > 0 ? strongTypes.join(", ") : "N/A"}
Growth Areas: ${weakTypes.length > 0 ? weakTypes.join(", ") : "N/A"}

Write in a warm, professional tone suitable for parents and educators.
Focus on celebrating cognitive strengths while framing growth areas as opportunities.
Reference the Grade Equivalent score and what it means relative to national norms.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        report,
        narrative: null,
        narrativeError: `Anthropic API error: ${errText}`,
      });
    }

    const data = await response.json();
    const narrative: string = data?.content?.[0]?.text ?? "";

    return NextResponse.json({ report, narrative: narrative || null });
  } catch (err) {
    return NextResponse.json({
      report,
      narrative: null,
      narrativeError: `Narrative generation failed: ${String(err)}`,
    });
  }
}
