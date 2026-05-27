"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { getCurrentExamMode } from "@/lib/exam-schedule";
import { canAccessFeature } from "@/lib/subscription";
import { useInscribeStore } from "@/store/inscribe-store";
import { ExamShieldScreen } from "@/components/ExamShieldScreen";
import type { KnowledgePillar, StudySession } from "@/types/database";

export default function SandboxPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const subscriptionTier = useInscribeStore((s) => s.subscriptionTier);
  const canvasText = useInscribeStore((s) => s.canvasText);
  const setCanvasText = useInscribeStore((s) => s.setCanvasText);
  const lastHint = useInscribeStore((s) => s.lastHint);
  const setLastHint = useInscribeStore((s) => s.setLastHint);
  const setUser = useInscribeStore((s) => s.setUser);

  const [session, setSession] = useState<StudySession | null>(null);
  const [pillars, setPillars] = useState<KnowledgePillar[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [stuckLoading, setStuckLoading] = useState(false);
  const [remainingHints, setRemainingHints] = useState(5);
  const [examMode, setExamMode] = useState("active");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speechEnabled = canAccessFeature(subscriptionTier, "speechToText");

  const handleTranscript = useCallback(
    (text: string) => {
      setCanvasText(canvasText + " " + text);
    },
    [canvasText, setCanvasText]
  );

  const { isListening, supported, toggle } = useSpeechRecognition({
    onTranscript: handleTranscript,
    enabled: speechEnabled,
  });

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
      setPillars(data.pillars ?? []);
      if (data.session?.raw_canvas_dump) {
        setCanvasText(data.session.raw_canvas_dump);
      }
      setRemainingHints(5 - (data.progress?.stuck_uses ?? 0));

      if (data.session?.exam_timestamp) {
        setExamMode(
          getCurrentExamMode(new Date(data.session.exam_timestamp), new Date(), {
            warmUpComplete: data.progress?.warm_up_complete,
            flashGlanceComplete: data.progress?.flash_glance_complete,
          })
        );
      }
    }
    load();
  }, [sessionId, router, setUser, setCanvasText]);

  function handleTextChange(text: string) {
    setCanvasText(text);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rawCanvasDump: text }),
      });
    }, 500);
  }

  async function handleStuck() {
    if (remainingHints <= 0) return;
    setStuckLoading(true);
    const res = await fetch("/api/stuck-hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, canvasText }),
    });
    const data = await res.json();
    if (res.ok) {
      setLastHint(data.hint);
      setRemainingHints(data.remainingUses);
    } else {
      setLastHint(data.error ?? "Hint unavailable");
    }
    setStuckLoading(false);
  }

  async function handleDone() {
    setEvaluating(true);
    const res = await fetch("/api/evaluate-dump", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, rawCanvasDump: canvasText }),
    });
    if (res.ok) {
      router.push(`/study/${sessionId}/diagnostics`);
    } else {
      setEvaluating(false);
    }
  }

  if (examMode !== "active") {
    return (
      <ExamShieldScreen
        mode={examMode as "sleep_lockout" | "morning_warmup" | "flash_glance" | "working_memory_shield" | "exam_complete"}
        redPillars={pillars.filter((p) => p.evaluation_tier === "red")}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-canvas">
      <header className="bg-lapis-dark text-white px-4 py-3 flex items-center justify-between">
        <h1 className="font-serif text-gold text-lg">Retrieval Sandbox</h1>
        <div className="flex items-center gap-3">
          {speechEnabled && supported && (
            <button
              onClick={toggle}
              className={`px-3 py-1 rounded-full text-sm ${
                isListening ? "bg-red-500 animate-pulse" : "bg-gold/20 text-gold"
              }`}
            >
              {isListening ? "● Recording" : "🎤 Mic"}
            </button>
          )}
          {!speechEnabled && (
            <span className="text-xs text-white/50" title="Premium feature">
              🎤 Premium
            </span>
          )}
          <button
            onClick={handleStuck}
            disabled={stuckLoading || remainingHints <= 0}
            className="px-3 py-1 rounded-full bg-white/10 text-sm hover:bg-white/20 disabled:opacity-50"
          >
            {stuckLoading ? "…" : `I'm Stuck (${remainingHints})`}
          </button>
          <button
            onClick={handleDone}
            disabled={evaluating || !canvasText.trim()}
            className="btn-primary text-sm py-1 px-4"
          >
            {evaluating ? "Evaluating…" : "DONE"}
          </button>
        </div>
      </header>

      {lastHint && (
        <div className="bg-gold/10 border-b border-gold/30 px-4 py-3">
          <p className="text-sm text-lapis italic">&ldquo;{lastHint}&rdquo;</p>
          <button
            onClick={() => setLastHint(null)}
            className="text-xs text-slate-muted mt-1 hover:text-lapis"
          >
            Dismiss
          </button>
        </div>
      )}

      <textarea
        className="flex-1 w-full p-6 bg-canvas-light text-slate text-lg resize-none focus:outline-none font-sans leading-relaxed"
        placeholder="Begin your un-cued brain dump here… recall everything you remember without looking at notes."
        value={canvasText}
        onChange={(e) => handleTextChange(e.target.value)}
      />

      <footer className="px-4 py-2 text-xs text-slate-muted text-center border-t border-gold/10">
        {pillars.length} Essential Knowledge Pillars · Un-cued active recall mode
      </footer>
    </div>
  );
}
