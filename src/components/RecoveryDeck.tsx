"use client";

import { useState } from "react";
import type { KnowledgePillar } from "@/types/database";
import type { SubscriptionTier } from "@/types/database";

interface RecoveryDeckProps {
  pillars: KnowledgePillar[];
  tier: SubscriptionTier;
  onMastered: (pillarId: string) => void;
  onComplete: () => void;
}

export function RecoveryDeck({
  pillars,
  tier,
  onMastered,
  onComplete,
}: RecoveryDeckProps) {
  const needsRecovery = pillars.filter(
    (p) => p.evaluation_tier === "yellow" || p.evaluation_tier === "red"
  );
  const [notYet, setNotYet] = useState<KnowledgePillar[]>(needsRecovery);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isPremium = tier === "premium";
  const current = notYet[currentIndex];

  function handleKnowIt() {
    if (!current) return;
    onMastered(current.id);
    const remaining = notYet.filter((p) => p.id !== current.id);
    setNotYet(remaining);
    if (remaining.length === 0) {
      onComplete();
    } else {
      setCurrentIndex(0);
    }
  }

  function handleNotYet() {
    if (!current) return;
    setCurrentIndex((prev) => (prev + 1) % notYet.length);
  }

  if (!isPremium) {
    return (
      <div className="card">
        <h3 className="font-serif text-lg text-lapis mb-4">Recovery Checklist</h3>
        <ul className="space-y-2">
          {needsRecovery.map((p) => (
            <li key={p.id} className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 accent-gold" />
              <span>
                <span className="font-semibold">{p.concept_name}</span>
                {p.diagnostic_feedback && (
                  <span className="text-slate-muted block">{p.diagnostic_feedback}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gold-dark">
          Upgrade to Premium for automated 2-pass interactive flashcards.
        </p>
      </div>
    );
  }

  if (notYet.length === 0) {
    return (
      <div className="card text-center border-gold/40 bg-gold/5">
        <p className="font-serif text-xl text-lapis">
          All recovery pillars mastered! 🎯
        </p>
      </div>
    );
  }

  return (
    <div className="card max-w-lg mx-auto">
      <div className="flex justify-between text-sm text-slate-muted mb-4">
        <span>Recovery Deck</span>
        <span>
          {notYet.length} remaining · Card {currentIndex + 1}
        </span>
      </div>

      <div className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-canvas rounded-xl border border-lapis/10 mb-6">
        <span
          className={`text-xs uppercase tracking-wide mb-2 ${
            current.evaluation_tier === "red" ? "text-red-600" : "text-yellow-600"
          }`}
        >
          {current.evaluation_tier === "red" ? "Missing" : "Partial"}
        </span>
        <h3 className="font-serif text-2xl text-lapis-dark text-center">
          {current.concept_name}
        </h3>
        {current.diagnostic_feedback && (
          <p className="text-sm text-slate-muted mt-3 text-center">
            {current.diagnostic_feedback}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button onClick={handleNotYet} className="btn-secondary flex-1">
          Not Yet
        </button>
        <button onClick={handleKnowIt} className="btn-primary flex-1">
          Know It
        </button>
      </div>
    </div>
  );
}
