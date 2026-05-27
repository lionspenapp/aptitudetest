"use client";

import { useEffect, useState } from "react";

export function BrainCoolingScreen() {
  const [mode] = useState<"breathing" | "puzzle">(() =>
    Math.random() > 0.5 ? "breathing" : "puzzle"
  );
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (mode !== "breathing") return;

    const phases: { phase: "inhale" | "hold" | "exhale"; duration: number; scale: number }[] = [
      { phase: "inhale", duration: 4000, scale: 1.6 },
      { phase: "hold", duration: 7000, scale: 1.6 },
      { phase: "exhale", duration: 8000, scale: 1 },
    ];

    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    function runPhase() {
      const current = phases[idx % phases.length];
      setBreathPhase(current.phase);
      setScale(current.scale);
      idx++;
      timeout = setTimeout(runPhase, current.duration);
    }

    runPhase();
    return () => clearTimeout(timeout);
  }, [mode]);

  const phaseLabel =
    breathPhase === "inhale"
      ? "Breathe In…"
      : breathPhase === "hold"
        ? "Hold…"
        : "Breathe Out…";

  return (
    <div className="fixed inset-0 z-50 bg-lapis-dark flex flex-col items-center justify-center text-white">
      <h2 className="font-serif text-3xl mb-2 text-gold">Brain Cooling</h2>
      <p className="text-white/70 mb-8 max-w-md text-center">
        Let your memory trace cool down. No study content is available during this break.
      </p>

      {mode === "breathing" ? (
        <div className="flex flex-col items-center gap-6">
          <div
            className="w-32 h-32 rounded-full bg-gold/30 border-2 border-gold transition-transform duration-[4000ms] ease-in-out"
            style={{ transform: `scale(${scale})` }}
          />
          <p className="text-xl font-serif text-gold">{phaseLabel}</p>
          <p className="text-sm text-white/50">4-7-8 breathing pattern</p>
        </div>
      ) : (
        <LogicGridPuzzle />
      )}
    </div>
  );
}

function LogicGridPuzzle() {
  const grid = [
    [3, null, 1],
    [null, 2, null],
    [1, null, 3],
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-white/60 mb-2">Fill in the missing numbers (1–3, no repeats)</p>
      <div className="grid grid-cols-3 gap-2">
        {grid.flatMap((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className="w-16 h-16 border border-gold/40 rounded-lg flex items-center justify-center text-2xl font-serif text-gold"
            >
              {cell ?? "?"}
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-white/40 mt-4">Focus on the pattern — timer will advance automatically</p>
    </div>
  );
}
