import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceSupabaseClient } from "@/lib/subscription";
import { buildMaterialCacheKey } from "@/lib/cache-key";
import { generateMaterials, getMockMaterials } from "@/lib/llm";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    profileId: string;
    unitId: string;
    courseLevel: string;
    topicTitle: string;
    questionCount: number;
    examFormat: string;
    examTimestamp: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const cacheKey = buildMaterialCacheKey(
    body.profileId,
    body.unitId,
    body.questionCount,
    body.examFormat
  );

  const serviceClient = createServiceSupabaseClient();

  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .insert({
      user_id: user.id,
      course_level: body.courseLevel,
      topic_title: body.topicTitle,
      question_count: body.questionCount,
      exam_format: body.examFormat as "multiple_choice" | "short_answer" | "mixed_frq",
      exam_timestamp: body.examTimestamp,
      profile_id: body.profileId,
      unit_id: body.unitId,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message ?? "Failed to create session" },
      { status: 500 }
    );
  }

  const { data: cached } = await serviceClient
    .from("material_cache")
    .select("*")
    .eq("cache_key", cacheKey)
    .single();

  let materialsPayload: {
    text_module: string;
    graphic_module_svg: string;
    problem_solving_json: { scenario: string; questions: string[] }[];
  };
  let pillarsPayload: { num: number; name: string }[];

  if (cached) {
    materialsPayload = cached.session_materials_payload;
    pillarsPayload = cached.pillars_payload;
    await serviceClient
      .from("material_cache")
      .update({ hit_count: (cached.hit_count ?? 0) + 1 })
      .eq("cache_key", cacheKey);
  } else {
    try {
      const generated =
        process.env.ANTHROPIC_API_KEY
          ? await generateMaterials({
              courseLevel: body.courseLevel,
              topicTitle: body.topicTitle,
              questionCount: body.questionCount,
              examFormat: body.examFormat,
            })
          : getMockMaterials({
              courseLevel: body.courseLevel,
              topicTitle: body.topicTitle,
              questionCount: body.questionCount,
              examFormat: body.examFormat,
            });

      materialsPayload = {
        text_module: generated.text_module,
        graphic_module_svg: generated.graphic_module_svg,
        problem_solving_json: generated.problem_solving,
      };
      pillarsPayload = generated.pillars;

      await serviceClient.from("material_cache").upsert({
        cache_key: cacheKey,
        session_materials_payload: materialsPayload,
        pillars_payload: pillarsPayload,
        hit_count: 0,
      });
    } catch (err) {
      return NextResponse.json(
        { error: `Material generation failed: ${String(err)}` },
        { status: 500 }
      );
    }
  }

  const { error: matError } = await supabase.from("session_materials").insert({
    session_id: session.id,
    text_module: materialsPayload.text_module,
    graphic_module_svg: materialsPayload.graphic_module_svg,
    problem_solving_json: materialsPayload.problem_solving_json,
  });

  if (matError) {
    return NextResponse.json({ error: matError.message }, { status: 500 });
  }

  const pillarRows = pillarsPayload.map((p) => ({
    session_id: session.id,
    pillar_number: p.num,
    concept_name: p.name,
  }));

  const { error: pillarError } = await supabase
    .from("knowledge_pillars")
    .insert(pillarRows);

  if (pillarError) {
    return NextResponse.json({ error: pillarError.message }, { status: 500 });
  }

  await supabase.from("session_progress").insert({
    session_id: session.id,
    current_phase: "block1_text",
    phase_started_at: new Date().toISOString(),
  });

  return NextResponse.json({ sessionId: session.id, cacheHit: !!cached });
}
