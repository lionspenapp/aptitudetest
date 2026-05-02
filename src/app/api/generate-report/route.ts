import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-report
 *
 * Accepts a scoring summary and returns an AI-generated narrative report
 * paragraph using the Anthropic Claude API (when ANTHROPIC_API_KEY is set).
 * Without the key the endpoint returns a 503 with a structured fallback hint.
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
            content: `You are a school psychologist writing a quarterly assessment summary.
Write a 3-paragraph personalized narrative based on this scoring data:

Student: ${body.studentName ?? "Student"}
Grade: ${body.enrolledGrade}
Quantitative GE: ${body.quantitativeGE ?? "N/A"}
Verbal GE: ${body.verbalGE ?? "N/A"}
Composite GE: ${body.compositeGE ?? "N/A"}
Growth Gap: ${body.growthGap ?? "N/A"}
Strengths: ${body.strengths?.join(", ") ?? "N/A"}
Growth Areas: ${body.growthAreas?.join(", ") ?? "N/A"}

Write in a warm, professional tone suitable for parents and educators.`,
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
