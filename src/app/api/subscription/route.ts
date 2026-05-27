import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getUserTier } from "@/lib/subscription";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ tier: "free" });
  }

  const tier = await getUserTier(user.id);
  return NextResponse.json({ tier, userId: user.id });
}
