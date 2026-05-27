"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { NavHeader } from "@/components/NavHeader";
import { TrafficLightDashboard } from "@/components/TrafficLightDashboard";
import { RecoveryDeck } from "@/components/RecoveryDeck";
import { useInscribeStore } from "@/store/inscribe-store";
import type { EvaluationResult } from "@/store/inscribe-store";
import type { KnowledgePillar } from "@/types/database";

export default function DiagnosticsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const subscriptionTier = useInscribeStore((s) => s.subscriptionTier);
  const setUser = useInscribeStore((s) => s.setUser);
  const setEvaluation = useInscribeStore((s) => s.setEvaluation);
  const initRecoveryDeck = useInscribeStore((s) => s.initRecoveryDeck);

  const [pillars, setPillars] = useState<KnowledgePillar[]>([]);
  const [evaluation, setEval] = useState<EvaluationResult | null>(null);
  const [masteryScore, setMasteryScore] = useState({ unlocked: 0, total: 0 });
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const subRes = await fetch("/api/subscription");
      const subData = await subRes.json();
      if (subData.userId) setUser(subData.userId, subData.tier);

      const res = await fetch(`/api/session?sessionId=${sessionId}`);
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      const pList = (data.pillars ?? []) as KnowledgePillar[];
      setPillars(pList);

      const hasEval = pList.some((p) => p.evaluation_tier);
      if (hasEval) {
        const evalResult: EvaluationResult = {
          green: pList
            .filter((p) => p.evaluation_tier === "green")
            .map((p) => ({
              pillar_num: p.pillar_number,
              concept: p.concept_name,
              reason: p.diagnostic_feedback ?? "",
              tier: "green" as const,
            })),
          yellow: pList
            .filter((p) => p.evaluation_tier === "yellow")
            .map((p) => ({
              pillar_num: p.pillar_number,
              concept: p.concept_name,
              gap: p.diagnostic_feedback ?? "",
              tier: "yellow" as const,
            })),
          red: pList
            .filter((p) => p.evaluation_tier === "red")
            .map((p) => ({
              pillar_num: p.pillar_number,
              concept: p.concept_name,
              missing: p.diagnostic_feedback ?? "",
              tier: "red" as const,
            })),
        };
        setEval(evalResult);
        setEvaluation(evalResult);
        initRecoveryDeck(pList);
        setMasteryScore({
          unlocked: evalResult.green.length,
          total: pList.length,
        });
      } else if (data.session?.raw_canvas_dump) {
        const evalRes = await fetch("/api/evaluate-dump", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            rawCanvasDump: data.session.raw_canvas_dump,
          }),
        });
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          setEval(evalData.evaluation);
          setEvaluation(evalData.evaluation);
          setPillars(evalData.pillars);
          initRecoveryDeck(evalData.pillars);
          setMasteryScore(evalData.masteryScore);
        }
      }

      setLoading(false);
    }
    load();
  }, [sessionId, router, setUser, setEvaluation, initRecoveryDeck]);

  async function handleMastered(pillarId: string) {
    await fetch("/api/pillar-mastery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pillarId, isMastered: true }),
    });
    useInscribeStore.getState().markKnowIt(pillarId);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-muted">Loading diagnostics…</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex-1 flex flex-col">
        <NavHeader />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-slate-muted mb-4">No brain dump to evaluate yet.</p>
          <Link href={`/study/${sessionId}/sandbox`} className="btn-primary">
            Go to Sandbox
          </Link>
        </main>
      </div>
    );
  }

  const needsRecovery =
    evaluation.yellow.length + evaluation.red.length > 0;

  return (
    <div className="flex-1 flex flex-col">
      <NavHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        <div>
          <h1 className="font-serif text-3xl text-lapis-dark mb-2">
            Traffic Light Diagnostics
          </h1>
          <p className="text-slate-muted">Your retrieval gap analysis</p>
        </div>

        <TrafficLightDashboard
          evaluation={evaluation}
          masteryScore={masteryScore}
          tier={subscriptionTier}
        />

        {needsRecovery && !recoveryComplete && (
          <div>
            <h2 className="font-serif text-xl text-lapis mb-4">
              2-Pass Recovery Deck
            </h2>
            <RecoveryDeck
              pillars={pillars}
              tier={subscriptionTier}
              onMastered={handleMastered}
              onComplete={() => setRecoveryComplete(true)}
            />
          </div>
        )}

        {(recoveryComplete || !needsRecovery) && (
          <div className="flex gap-4 justify-center">
            <Link
              href={`/study/${sessionId}/exam-shield`}
              className="btn-primary"
            >
              Exam Safety Shell
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
