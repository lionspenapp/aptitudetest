"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExamShieldMode } from "@/lib/exam-schedule";

interface ExamShieldScreenProps {
  mode: ExamShieldMode;
  redPillars?: { concept_name: string; diagnostic_feedback: string | null }[];
  onWarmUpComplete?: () => void;
  onFlashGlanceComplete?: () => void;
}

export function ExamShieldScreen({
  mode,
  redPillars = [],
  onWarmUpComplete,
  onFlashGlanceComplete,
}: ExamShieldScreenProps) {
  switch (mode) {
    case "sleep_lockout":
      return (
        <ShieldLayout title="Sleep Consolidation Active">
          <p className="text-lg text-white/80 max-w-lg text-center">
            Active studying is closed. Your brain is now entering sleep-dependent
            memory consolidation.
          </p>
          <p className="text-sm text-white/50 mt-4">
            Return tomorrow morning for your pre-flight warm-up.
          </p>
        </ShieldLayout>
      );

    case "morning_warmup":
      return (
        <ShieldLayout title="Morning Warm-Up" variant="warm">
          <MorningWarmUp onComplete={onWarmUpComplete} />
        </ShieldLayout>
      );

    case "flash_glance":
      return (
        <ShieldLayout title="Track C — Flash Glance" variant="warm">
          <FlashGlance redPillars={redPillars} onComplete={onFlashGlanceComplete} />
        </ShieldLayout>
      );

    case "working_memory_shield":
      return (
        <ShieldLayout title="Working Memory Protect">
          <p className="text-lg text-white/80 max-w-lg text-center">
            Stop studying. Put your device away. Protect your working memory
            capacity. Take a deep breath — your brain has inscribed the content.
          </p>
        </ShieldLayout>
      );

    case "exam_complete":
      return (
        <ShieldLayout title="Exam Time" variant="warm">
          <p className="text-lg text-white/80 max-w-lg text-center">
            Your exam window has opened. Trust your preparation. Good luck!
          </p>
        </ShieldLayout>
      );

    default:
      return null;
  }
}

function ShieldLayout({
  title,
  children,
  variant = "dark",
}: {
  title: string;
  children: React.ReactNode;
  variant?: "dark" | "warm";
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 ${
        variant === "dark" ? "bg-lapis-dark" : "bg-lapis"
      } text-white`}
    >
      <h1 className="font-serif text-3xl text-gold mb-8">{title}</h1>
      {children}
    </div>
  );
}

function MorningWarmUp({ onComplete }: { onComplete?: () => void }) {
  const warmupSeconds =
    process.env.NEXT_PUBLIC_INSCRIBE_DEV_TIMERS === "true" ? 10 : 300;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
      <p className="text-white/70 text-center">
        5-minute un-cued brain dump to awaken retrieval networks. No notes, no
        materials — just recall.
      </p>
      <textarea
        className="w-full h-40 input-field text-slate bg-white/90 resize-none"
        placeholder="Dump everything you remember…"
      />
      <CountdownButton
        seconds={warmupSeconds}
        label="Start Warm-Up"
        onComplete={onComplete}
      />
    </div>
  );
}

function FlashGlance({
  redPillars,
  onComplete,
}: {
  redPillars: { concept_name: string; diagnostic_feedback: string | null }[];
  onComplete?: () => void;
}) {
  const glanceSeconds =
    process.env.NEXT_PUBLIC_INSCRIBE_DEV_TIMERS === "true" ? 5 : 60;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <p className="text-white/60 text-sm">
        60 seconds — Red concepts only. No re-reading after lockout.
      </p>
      <div className="card bg-white/10 border-gold/30 w-full max-h-64 overflow-hidden">
        {redPillars.length === 0 ? (
          <p className="text-white/60 text-center">No red pillars — great work!</p>
        ) : (
          <ul className="space-y-3">
            {redPillars.map((p, i) => (
              <li key={i} className="text-white">
                <span className="font-semibold text-gold">{p.concept_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <CountdownButton
        seconds={glanceSeconds}
        label="Begin Flash Glance"
        onComplete={onComplete}
      />
    </div>
  );
}

function CountdownButton({
  seconds,
  label,
  onComplete,
}: {
  seconds: number;
  label: string;
  onComplete?: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  useEffect(() => {
    if (remaining === 0) {
      onComplete?.();
      setRemaining(null);
    }
  }, [remaining, onComplete]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  if (remaining !== null && remaining > 0) {
    return (
      <p className="font-serif text-4xl text-gold">
        {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, "0")}
      </p>
    );
  }

  return (
    <button onClick={start} className="btn-primary">
      {label}
    </button>
  );
}
