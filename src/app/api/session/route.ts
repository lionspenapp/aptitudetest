import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { SpacedPhase } from "@/types/database";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: progress } = await supabase
    .from("session_progress")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  const { data: materials } = await supabase
    .from("session_materials")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  const { data: pillars } = await supabase
    .from("knowledge_pillars")
    .select("*")
    .eq("session_id", sessionId)
    .order("pillar_number");

  return NextResponse.json({
    session,
    progress,
    materials,
    pillars,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    sessionId: string;
    currentPhase?: SpacedPhase;
    phaseStartedAt?: string;
    spacedComplete?: boolean;
    warmUpComplete?: boolean;
    flashGlanceComplete?: boolean;
    rawCanvasDump?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("id", body.sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (body.rawCanvasDump !== undefined) {
    await supabase
      .from("study_sessions")
      .update({ raw_canvas_dump: body.rawCanvasDump })
      .eq("id", body.sessionId);
  }

  const progressUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.currentPhase) progressUpdate.current_phase = body.currentPhase;
  if (body.phaseStartedAt) progressUpdate.phase_started_at = body.phaseStartedAt;
  if (body.spacedComplete !== undefined)
    progressUpdate.spaced_complete = body.spacedComplete;
  if (body.warmUpComplete !== undefined)
    progressUpdate.warm_up_complete = body.warmUpComplete;
  if (body.flashGlanceComplete !== undefined)
    progressUpdate.flash_glance_complete = body.flashGlanceComplete;

  const { data: progress, error } = await supabase
    .from("session_progress")
    .update(progressUpdate)
    .eq("session_id", body.sessionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress });
}
