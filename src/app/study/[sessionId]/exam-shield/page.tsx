"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { NavHeader } from "@/components/NavHeader";
import { ExamShieldScreen } from "@/components/ExamShieldScreen";
import {
  formatExamCountdown,
  getCurrentExamMode,
  getSleepLockoutTime,
  getWorkingMemoryShieldTime,
} from "@/lib/exam-schedule";
import { canAccessFeature } from "@/lib/subscription";
import { useInscribeStore } from "@/store/inscribe-store";
import type { KnowledgePillar, SessionProgress, StudySession } from "@/types/database";

export default function ExamShieldPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const subscriptionTier = useInscribeStore((s) => s.subscriptionTier);
  const setUser = useInscribeStore((s) => s.setUser);

  const [session, setSession] = useState<StudySession | null>(null);
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [pillars, setPillars] = useState<KnowledgePillar[]>([]);
  const [examMode, setExamMode] = useState("active");
  const [loading, setLoading] = useState(true);

  const hasExamShell = canAccessFeature(subscriptionTier, "examSafetyShell");

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
      setProgress(data.progress);
      setPillars(data.pillars ?? []);

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

    const interval = setInterval(() => {
      if (session?.exam_timestamp) {
        setExamMode(
          getCurrentExamMode(new Date(session.exam_timestamp), new Date(), {
            warmUpComplete: progress?.warm_up_complete,
            flashGlanceComplete: progress?.flash_glance_complete,
          })
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionId, router, setUser, session?.exam_timestamp, progress?.warm_up_complete, progress?.flash_glance_complete]);

  async function markWarmUpComplete() {
    await fetch("/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, warmUpComplete: true }),
    });
    setProgress((p) => (p ? { ...p, warm_up_complete: true } : p));
    if (session?.exam_timestamp) {
      setExamMode(
        getCurrentExamMode(new Date(session.exam_timestamp), new Date(), {
          warmUpComplete: true,
          flashGlanceComplete: progress?.flash_glance_complete,
        })
      );
    }
  }

  async function markFlashGlanceComplete() {
    await fetch("/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, flashGlanceComplete: true }),
    });
    setProgress((p) => (p ? { ...p, flash_glance_complete: true } : p));
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-muted">Loading exam shield…</p>
      </div>
    );
  }

  if (!hasExamShell) {
    return (
      <div className="flex-1 flex flex-col">
        <NavHeader />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-8">
          <div className="card text-center">
            <h1 className="font-serif text-2xl text-lapis mb-4">Exam Countdown</h1>
            {session?.exam_timestamp && (
              <p className="text-lg text-gold-dark mb-4">
                {formatExamCountdown(new Date(session.exam_timestamp))}
              </p>
            )}
            <p className="text-slate-muted mb-6">
              Basic countdown alarm is available on the free tier. Upgrade for sleep
              consolidation lockout, morning warm-up, flash glance, and working memory
              protection.
            </p>
            <Link href="/dashboard?upgrade=true" className="btn-primary">
              Upgrade to Premium
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (examMode !== "active") {
    return (
      <ExamShieldScreen
        mode={examMode as "sleep_lockout" | "morning_warmup" | "flash_glance" | "working_memory_shield" | "exam_complete"}
        redPillars={pillars.filter((p) => p.evaluation_tier === "red")}
        onWarmUpComplete={markWarmUpComplete}
        onFlashGlanceComplete={markFlashGlanceComplete}
      />
    );
  }

  const examDate = session?.exam_timestamp
    ? new Date(session.exam_timestamp)
    : null;

  return (
    <div className="flex-1 flex flex-col">
      <NavHeader />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-serif text-3xl text-lapis-dark">Exam Safety Shell</h1>

        {examDate && (
          <>
            <div className="card">
              <h3 className="font-serif text-lg text-lapis mb-2">Exam Countdown</h3>
              <p className="text-2xl text-gold-dark font-serif">
                {formatExamCountdown(examDate)}
              </p>
              <p className="text-sm text-slate-muted mt-2">
                Exam: {examDate.toLocaleString()}
              </p>
            </div>

            <div className="card space-y-3">
              <h3 className="font-serif text-lg text-lapis">Scheduled Lockouts</h3>
              <div className="text-sm space-y-2 text-slate-muted">
                <p>
                  🌙 Sleep lockout:{" "}
                  {getSleepLockoutTime(examDate).toLocaleString()}
                </p>
                <p>
                  🛡️ Working memory shield:{" "}
                  {getWorkingMemoryShieldTime(examDate).toLocaleString()}
                </p>
              </div>
            </div>
          </>
        )}

        <p className="text-sm text-slate-muted">
          The exam safety shell will automatically activate at the scheduled times.
          Keep this session linked to your exam date.
        </p>

        <Link href="/dashboard" className="btn-secondary inline-block">
          Back to Dashboard
        </Link>
      </main>
    </div>
  );
}
