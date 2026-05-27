"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NavHeader } from "@/components/NavHeader";
import { BrainCoolingScreen } from "@/components/BrainCoolingScreen";
import { TextModulePanel } from "@/components/TextModulePanel";
import { GraphicModulePanel } from "@/components/GraphicModulePanel";
import { ProblemModulePanel } from "@/components/ProblemModulePanel";
import { ExamShieldScreen } from "@/components/ExamShieldScreen";
import {
  formatTime,
  getNextPhase,
  getPhaseDuration,
  getPhaseLabel,
  isDistractorPhase,
} from "@/lib/spaced-timer";
import { getCurrentExamMode } from "@/lib/exam-schedule";
import { canAccessFeature } from "@/lib/subscription";
import { useInscribeStore } from "@/store/inscribe-store";
import type { SessionMaterial, SessionProgress, SpacedPhase, StudySession, ProblemScenario } from "@/types/database";

export default function SpacedLearningPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const subscriptionTier = useInscribeStore((s) => s.subscriptionTier);
  const setUser = useInscribeStore((s) => s.setUser);

  const [session, setSession] = useState<StudySession | null>(null);
  const [materials, setMaterials] = useState<SessionMaterial | null>(null);
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examMode, setExamMode] = useState<string>("active");
  const advancingRef = useRef(false);

  const hasPremiumContent = canAccessFeature(subscriptionTier, "spacedPackGeneration");

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
      setSession(data.session);
      setMaterials(data.materials);
      setProgress(data.progress);

      const phase = (data.progress?.current_phase ?? "block1_text") as SpacedPhase;
      setRemaining(getPhaseDuration(phase));

      if (data.session?.exam_timestamp) {
        setExamMode(
          getCurrentExamMode(new Date(data.session.exam_timestamp), new Date(), {
            warmUpComplete: data.progress?.warm_up_complete,
            flashGlanceComplete: data.progress?.flash_glance_complete,
          })
        );
      }

      setLoading(false);
    }
    load();
  }, [sessionId, router, setUser]);

  useEffect(() => {
    if (remaining <= 0 || !progress) return;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, progress]);

  const advancePhase = useCallback(async () => {
    if (!progress || advancingRef.current) return;
    advancingRef.current = true;

    const next = getNextPhase(progress.current_phase as SpacedPhase);

    await fetch("/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        currentPhase: next,
        phaseStartedAt: new Date().toISOString(),
        spacedComplete: next === "complete",
      }),
    });

    setProgress((p) =>
      p ? { ...p, current_phase: next, spaced_complete: next === "complete" } : p
    );
    setRemaining(getPhaseDuration(next));

    advancingRef.current = false;

    if (next === "complete") {
      router.push(`/study/${sessionId}/sandbox`);
    }
  }, [progress, sessionId, router]);

  useEffect(() => {
    if (remaining === 0 && progress && !loading && progress.current_phase !== "complete") {
      advancePhase();
    }
  }, [remaining, progress, loading, advancePhase]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (progress && progress.current_phase !== "complete") {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [progress]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-muted">Loading session…</p>
      </div>
    );
  }

  if (examMode !== "active") {
    return (
      <ExamShieldScreen
        mode={examMode as "sleep_lockout" | "morning_warmup" | "flash_glance" | "working_memory_shield" | "exam_complete"}
      />
    );
  }

  const phase = (progress?.current_phase ?? "block1_text") as SpacedPhase;

  if (isDistractorPhase(phase)) {
    return <BrainCoolingScreen />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="bg-lapis-dark text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <span className="font-serif text-gold">{getPhaseLabel(phase)}</span>
        <span className="font-mono text-2xl text-gold">{formatTime(remaining)}</span>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {!hasPremiumContent ? (
          <div className="card text-center py-12">
            <h2 className="font-serif text-xl text-lapis mb-4">Premium Content Locked</h2>
            <p className="text-slate-muted mb-6">
              Full automated spaced learning pack generation requires InScribe Premium.
              The timer is running — upgrade to view study materials.
            </p>
            <a href="/dashboard?upgrade=true" className="btn-primary">
              Upgrade to Premium
            </a>
          </div>
        ) : (
          <>
            {phase === "block1_text" && materials && (
              <TextModulePanel content={materials.text_module} />
            )}
            {phase === "block2_graphic" && materials && (
              <GraphicModulePanel content={materials.graphic_module_svg} />
            )}
            {phase === "block3_problems" && materials && (
              <ProblemModulePanel
                scenarios={
                  (materials.problem_solving_json as unknown as ProblemScenario[]) ?? []
                }
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
