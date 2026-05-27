import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { evaluateDump, getMockEvaluation } from "@/lib/llm";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId: string; rawCanvasDump: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: pillars } = await supabase
    .from("knowledge_pillars")
    .select("*")
    .eq("session_id", body.sessionId)
    .order("pillar_number");

  if (!pillars?.length) {
    return NextResponse.json({ error: "No pillars found" }, { status: 404 });
  }

  const pillarList = pillars.map((p) => ({
    num: p.pillar_number,
    name: p.concept_name,
  }));

  let evaluation;
  try {
    evaluation = process.env.ANTHROPIC_API_KEY
      ? await evaluateDump({
          pillars: pillarList,
          rawCanvasDump: body.rawCanvasDump,
        })
      : getMockEvaluation(pillarList, body.rawCanvasDump);
  } catch (err) {
    return NextResponse.json(
      { error: `Evaluation failed: ${String(err)}` },
      { status: 500 }
    );
  }

  await supabase
    .from("study_sessions")
    .update({ raw_canvas_dump: body.rawCanvasDump })
    .eq("id", body.sessionId);

  for (const item of evaluation.green) {
    await supabase
      .from("knowledge_pillars")
      .update({
        evaluation_tier: "green",
        diagnostic_feedback: item.reason,
      })
      .eq("session_id", body.sessionId)
      .eq("pillar_number", item.pillar_num);
  }

  for (const item of evaluation.yellow) {
    await supabase
      .from("knowledge_pillars")
      .update({
        evaluation_tier: "yellow",
        diagnostic_feedback: item.gap,
      })
      .eq("session_id", body.sessionId)
      .eq("pillar_number", item.pillar_num);
  }

  for (const item of evaluation.red) {
    await supabase
      .from("knowledge_pillars")
      .update({
        evaluation_tier: "red",
        diagnostic_feedback: item.missing,
      })
      .eq("session_id", body.sessionId)
      .eq("pillar_number", item.pillar_num);
  }

  const { data: updatedPillars } = await supabase
    .from("knowledge_pillars")
    .select("*")
    .eq("session_id", body.sessionId)
    .order("pillar_number");

  return NextResponse.json({
    evaluation,
    pillars: updatedPillars,
    masteryScore: {
      unlocked: evaluation.green.length,
      total: pillars.length,
    },
  });
}
