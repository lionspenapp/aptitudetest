import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  const supabase = await createServerSupabaseClient();

  if (profileId) {
    const { data, error } = await supabase
      .from("curriculum_units")
      .select("*")
      .eq("profile_id", profileId)
      .order("unit_number");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ units: data });
  }

  const { data, error } = await supabase
    .from("curriculum_profiles")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data });
}
