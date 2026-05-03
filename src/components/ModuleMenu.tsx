"use client";

import type { Module, PartNumber } from "@/types/database";

export interface PartStatus {
  module: Module;
  part: PartNumber;
  done: boolean;
  unlocked: boolean;
}

interface ModuleMenuProps {
  onSelectPart: (module: Module, part: PartNumber) => void;
  onViewReport?: () => void;
  partStatuses: PartStatus[];
  allDone: boolean;
}

const MODULES: {
  key: Module;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    key: "quantitative",
    label: "Quantitative Reasoning",
    icon: "🔢",
    description: "Number reasoning, patterns, quantitative analogies, logic",
  },
  {
    key: "verbal",
    label: "Verbal Reasoning",
    icon: "📖",
    description: "Analogies, vocabulary, reading comprehension, language reasoning",
  },
];

export default function ModuleMenu({
  onSelectPart,
  onViewReport,
  partStatuses,
  allDone,
}: ModuleMenuProps) {
  const statusFor = (module: Module, part: PartNumber): PartStatus =>
    partStatuses.find((s) => s.module === module && s.part === part) ?? {
      module,
      part,
      done: false,
      unlocked: part === 1,
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <span className="text-5xl block mb-3">🦁</span>
          <h1 className="text-2xl font-bold text-[#1A2744]">
            Choose Your Module
          </h1>
          <p className="text-[#1A2744]/60 mt-2 text-sm">
            Each module has two 20-question parts. Complete all four parts to
            unlock your full quarterly report.
          </p>
        </div>

        <div className="space-y-5">
          {MODULES.map((mod) => {
            const part1 = statusFor(mod.key, 1);
            const part2 = statusFor(mod.key, 2);
            const moduleDone = part1.done && part2.done;

            return (
              <div
                key={mod.key}
                className={`rounded-2xl border-2 bg-white p-5 transition-shadow ${
                  moduleDone
                    ? "border-green-300 bg-green-50"
                    : "border-[#B8892A]/20"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{mod.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[#1A2744] uppercase tracking-wide">
                        {mod.label}
                      </h2>
                      {moduleDone && (
                        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Done ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#1A2744]/60 mt-1">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <PartRow
                    part={1}
                    status={part1}
                    onSelect={() => onSelectPart(mod.key, 1)}
                  />
                  <PartRow
                    part={2}
                    status={part2}
                    onSelect={() => onSelectPart(mod.key, 2)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {allDone && onViewReport && (
          <div className="mt-8 text-center">
            <button
              onClick={onViewReport}
              className="px-8 py-3.5 rounded-xl bg-[#1A2744] text-white font-semibold shadow-md hover:bg-[#1A2744]/90 transition-colors"
            >
              Generate Quarterly Report →
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-[#1A2744]/40">
            Part 2 unlocks once Part 1 is complete · 40 items per module per
            quarter
          </p>
        </div>
      </div>
    </div>
  );
}

function PartRow({
  part,
  status,
  onSelect,
}: {
  part: PartNumber;
  status: PartStatus;
  onSelect: () => void;
}) {
  const { done, unlocked } = status;

  let badgeText: string;
  let badgeClass: string;
  let containerClass: string;
  let disabled: boolean;

  if (done) {
    badgeText = "✓ Done";
    badgeClass = "bg-green-100 text-green-700";
    containerClass =
      "border-green-200 bg-green-50/50 cursor-default";
    disabled = true;
  } else if (!unlocked) {
    badgeText = "🔒 Locked";
    badgeClass = "bg-[#1A2744]/10 text-[#1A2744]/50";
    containerClass =
      "border-[#1A2744]/10 bg-[#FAF7F0]/60 cursor-not-allowed opacity-70";
    disabled = true;
  } else {
    badgeText = "→ Start";
    badgeClass = "bg-[#B8892A] text-white";
    containerClass =
      "border-[#B8892A]/30 bg-white hover:border-[#B8892A] hover:shadow-sm cursor-pointer";
    disabled = false;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-colors text-left ${containerClass}`}
    >
      <div>
        <p className="text-sm font-semibold text-[#1A2744]">
          Part {part}
        </p>
        <p className="text-xs text-[#1A2744]/50">20 questions</p>
      </div>
      <span
        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${badgeClass}`}
      >
        {badgeText}
      </span>
    </button>
  );
}
