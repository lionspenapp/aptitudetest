/** Valid HTTP(S) URL string for constructing the Supabase client. */
export function getSupabaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || url === "YOUR_SUPABASE_URL") {
    return null;
  }
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

export function getSupabaseAnonKey(): string | null {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (
    !key ||
    key === "YOUR_SUPABASE_ANON_KEY" ||
    key === "placeholder" ||
    key.length < 20
  ) {
    return null;
  }
  return key;
}

export function supabaseConfigured(): boolean {
  return !!(getSupabaseUrl() && getSupabaseAnonKey());
}
