import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-report
 *
 * Server-side API route for Claude narrative report generation.
 * ⚠ NEVER expose the Anthropic API key client-side.
 *
 * The client sends only the scoring summary — the server calls Claude.
 * Without ANTHROPIC_API_KEY, returns 503 with a hint that the local
 * structured report is still complete without the narrative.
 *
 * Request body:
 * {
 *   studentName, enrolledGrade, quantitativeGE, verbalGE,
 *   compositeGE, growthGap, strengths[], growthAreas[]
 * }
 *
 * Response:
 * { narrative: "3-paragraph personalized narrative..." }
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "ANTHROPIC_API_KEY not configured",
        hint: "The structured local report is still complete without the narrative.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

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

Student: ${body.studentName ?? "Student"}
Grade: ${body.enrolledGrade}
Quantitative GE: ${body.quantitativeGE ?? "N/A"}
Verbal GE: ${body.verbalGE ?? "N/A"}
Composite GE: ${body.compositeGE ?? "N/A"}
Growth Gap: ${body.growthGap ?? "N/A"}
Strengths: ${body.strengths?.join(", ") ?? "N/A"}
Growth Areas: ${body.growthAreas?.join(", ") ?? "N/A"}

Write in a warm, professional tone suitable for parents and educators.
Focus on celebrating cognitive strengths while framing growth areas as opportunities.
Reference the Grade Equivalent score and what it means relative to national norms.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: "Anthropic API error", details: errText },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ narrative: data.content[0].text });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate report", details: String(err) },
      { status: 500 }
    );
  }
}
