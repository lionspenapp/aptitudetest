"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NavHeader } from "@/components/NavHeader";
import { createClient } from "@/lib/supabase-client";
import { useInscribeStore } from "@/store/inscribe-store";
import type { StudySession, KnowledgePillar } from "@/types/database";

interface SessionSummary extends StudySession {
  green_count: number;
  red_count: number;
  total_pillars: number;
}

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionTier = useInscribeStore((s) => s.subscriptionTier);
  const setUser = useInscribeStore((s) => s.setUser);

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const subRes = await fetch("/api/subscription");
      const subData = await subRes.json();
      setUser(user.id, subData.tier ?? "free");

      const { data: sessionRows } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sessionRows) {
        const summaries: SessionSummary[] = [];
        for (const s of sessionRows) {
          const { data: pillars } = await supabase
            .from("knowledge_pillars")
            .select("*")
            .eq("session_id", s.id);

          const pList = (pillars ?? []) as KnowledgePillar[];
          summaries.push({
            ...s,
            green_count: pList.filter((p) => p.evaluation_tier === "green").length,
            red_count: pList.filter((p) => p.evaluation_tier === "red").length,
            total_pillars: pList.length,
          });
        }
        setSessions(summaries);
      }

      setLoading(false);
    }
    load();
  }, [router, setUser]);

  async function handleUpgrade() {
    setCheckoutLoading(true);
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Checkout unavailable");
      setCheckoutLoading(false);
    }
  }

  const showUpgrade =
    searchParams.get("upgrade") === "true" || subscriptionTier === "free";

  return (
    <div className="flex-1 flex flex-col">
      <NavHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-lapis-dark">Dashboard</h1>
            <p className="text-slate-muted">Your study session history</p>
          </div>
          <Link href="/setup" className="btn-primary">
            New Session
          </Link>
        </div>

        {showUpgrade && subscriptionTier === "free" && (
          <div className="card border-gold/40 bg-gold/5 mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg text-lapis">Upgrade to Premium</h3>
              <p className="text-sm text-slate-muted">
                Unlock speech-to-text, full spaced packs, traffic light UI, recovery
                flashcards, and exam safety shell — $14.99/mo
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              className="btn-primary whitespace-nowrap"
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Loading…" : "Upgrade"}
            </button>
          </div>
        )}

        {searchParams.get("upgraded") === "true" && (
          <div className="card border-green-500/30 bg-green-50 mb-8">
            <p className="text-green-800">Welcome to InScribe Premium!</p>
          </div>
        )}

        {loading ? (
          <p className="text-slate-muted">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-muted mb-4">No study sessions yet.</p>
            <Link href="/setup" className="btn-primary">
              Create Your First Session
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div key={s.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg text-lapis">{s.topic_title}</h3>
                  <p className="text-sm text-slate-muted">
                    {s.course_level} · {s.question_count} pillars ·{" "}
                    {s.exam_format.replace(/_/g, " ")}
                  </p>
                  {s.total_pillars > 0 && (
                    <p className="text-sm mt-1">
                      <span className="text-green-700">{s.green_count} green</span>
                      {" · "}
                      <span className="text-red-600">{s.red_count} red</span>
                      {" · "}
                      {s.total_pillars} total
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/study/${s.id}/spaced`}
                    className="text-sm text-lapis hover:text-gold"
                  >
                    Continue
                  </Link>
                  {s.total_pillars > 0 && s.green_count + s.red_count > 0 && (
                    <Link
                      href={`/study/${s.id}/diagnostics`}
                      className="text-sm text-gold-dark hover:text-gold"
                    >
                      Diagnostics
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
