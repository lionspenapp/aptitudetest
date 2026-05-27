import { createClient } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/types/database";

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("tier, expires_at")
    .eq("user_id", userId)
    .single();

  if (!data) return "free";
  if (data.tier === "premium" && data.expires_at) {
    if (new Date(data.expires_at) < new Date()) return "free";
  }
  return data.tier as SubscriptionTier;
}

export function isPremiumTier(tier: SubscriptionTier): boolean {
  return tier === "premium";
}

export const PREMIUM_FEATURES = {
  speechToText: "premium" as const,
  spacedPackGeneration: "premium" as const,
  trafficLightUI: "premium" as const,
  recoveryFlashcards: "premium" as const,
  examSafetyShell: "premium" as const,
};

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof typeof PREMIUM_FEATURES
): boolean {
  if (PREMIUM_FEATURES[feature] === "premium") {
    return tier === "premium";
  }
  return true;
}
