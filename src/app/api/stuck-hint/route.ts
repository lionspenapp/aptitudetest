import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateStuckHint, getMockStuckHint } from "@/lib/llm";

const MAX_STUCK_USES = 5;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId: string; canvasText: string };

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

  const { data: progress } = await supabase
    .from("session_progress")
    .select("*")
    .eq("session_id", body.sessionId)
    .single();

  const stuckUses = progress?.stuck_uses ?? 0;
  if (stuckUses >= MAX_STUCK_USES) {
    return NextResponse.json(
      { error: "Maximum hint limit reached (5 per session)" },
      { status: 429 }
    );
  }

  const { data: pillars } = await supabase
    .from("knowledge_pillars")
    .select("*")
    .eq("session_id", body.sessionId)
    .order("pillar_number");

  const pillarList = (pillars ?? []).map((p) => ({
    num: p.pillar_number,
    name: p.concept_name,
  }));

  let hintResult;
  try {
    hintResult = process.env.ANTHROPIC_API_KEY
      ? await generateStuckHint({
          pillars: pillarList,
          canvasText: body.canvasText,
        })
      : getMockStuckHint(pillarList);
  } catch (err) {
    return NextResponse.json(
      { error: `Hint generation failed: ${String(err)}` },
      { status: 500 }
    );
  }

  await supabase
    .from("session_progress")
    .update({
      stuck_uses: stuckUses + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", body.sessionId);

  return NextResponse.json({
    hint: hintResult.hint,
    remainingUses: MAX_STUCK_USES - stuckUses - 1,
  });
}
