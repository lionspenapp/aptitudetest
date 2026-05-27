"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useInscribeStore } from "@/store/inscribe-store";

export function NavHeader() {
  const router = useRouter();
  const subscriptionTier = useInscribeStore((s) => s.subscriptionTier);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    useInscribeStore.getState().reset();
    router.push("/");
  }

  return (
    <header className="border-b border-gold/20 bg-canvas-light/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-lapis-dark font-bold">
          InScribe
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/setup" className="text-lapis hover:text-gold transition-colors">
            New Session
          </Link>
          <Link href="/dashboard" className="text-lapis hover:text-gold transition-colors">
            Dashboard
          </Link>
          {subscriptionTier === "free" && (
            <Link
              href="/dashboard?upgrade=true"
              className="text-gold-dark font-semibold hover:text-gold transition-colors"
            >
              Upgrade
            </Link>
          )}
          {subscriptionTier === "premium" && (
            <span className="text-gold font-semibold text-xs uppercase tracking-wide">
              Premium
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-slate-muted hover:text-lapis transition-colors"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
