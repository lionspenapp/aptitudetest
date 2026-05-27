"use client";

import type { EvaluationResult } from "@/store/inscribe-store";
import type { SubscriptionTier } from "@/types/database";

interface TrafficLightDashboardProps {
  evaluation: EvaluationResult;
  masteryScore: { unlocked: number; total: number };
  tier: SubscriptionTier;
}

export function TrafficLightDashboard({
  evaluation,
  masteryScore,
  tier,
}: TrafficLightDashboardProps) {
  const isPremium = tier === "premium";

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-gold/10 to-gold/5 border-gold/40 text-center">
        <p className="font-serif text-2xl text-lapis-dark">
          You unlocked{" "}
          <span className="text-gold font-bold">{masteryScore.unlocked}</span> out
          of{" "}
          <span className="text-gold font-bold">{masteryScore.total}</span>{" "}
          Essential Knowledge Pillars from memory!
        </p>
      </div>

      {isPremium ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Column
            title="Nailed It"
            emoji="🟢"
            items={evaluation.green.map((g) => ({
              concept: g.concept,
              detail: g.reason ?? "",
            }))}
            borderColor="border-green-500/30"
            bgColor="bg-green-50"
          />
          <Column
            title="Partial / Hazy"
            emoji="🟡"
            items={evaluation.yellow.map((y) => ({
              concept: y.concept,
              detail: y.gap ?? "",
            }))}
            borderColor="border-yellow-500/30"
            bgColor="bg-yellow-50"
          />
          <Column
            title="Missing / Forgotten"
            emoji="🔴"
            items={evaluation.red.map((r) => ({
              concept: r.concept,
              detail: r.missing ?? "",
            }))}
            borderColor="border-red-500/30"
            bgColor="bg-red-50"
          />
        </div>
      ) : (
        <div className="card">
          <h3 className="font-serif text-lg text-lapis mb-4">Diagnostic Summary</h3>
          <div className="space-y-2 text-sm text-slate-muted">
            <p>🟢 Green: {evaluation.green.length} concepts nailed</p>
            <p>🟡 Yellow: {evaluation.yellow.length} concepts partial</p>
            <p>🔴 Red: {evaluation.red.length} concepts missing</p>
          </div>
          <p className="mt-4 text-sm text-gold-dark">
            Upgrade to Premium for the full 3-column Traffic Light dashboard.
          </p>
        </div>
      )}
    </div>
  );
}

function Column({
  title,
  emoji,
  items,
  borderColor,
  bgColor,
}: {
  title: string;
  emoji: string;
  items: { concept: string; detail: string }[];
  borderColor: string;
  bgColor: string;
}) {
  return (
    <div className={`card ${borderColor} ${bgColor}`}>
      <h3 className="font-serif text-lg text-lapis-dark mb-4">
        {emoji} {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-muted italic">None</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="text-sm">
              <p className="font-semibold text-slate">{item.concept}</p>
              <p className="text-slate-muted mt-1">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
