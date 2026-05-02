"use client";

import type { Module } from "@/types/database";

interface ModuleMenuProps {
  onSelectModule: (module: Module) => void;
  completedModules?: Module[];
}

const MODULES: {
  key: Module;
  label: string;
  icon: string;
  description: string;
  duration: string;
}[] = [
  {
    key: "quantitative",
    label: "Quantitative Reasoning",
    icon: "🔢",
    description: "Number reasoning, patterns, quantitative analogies, logic",
    duration: "~12–15 minutes",
  },
  {
    key: "verbal",
    label: "Verbal Reasoning",
    icon: "📖",
    description: "Analogies, vocabulary, reading comprehension, language reasoning",
    duration: "~15–18 minutes",
  },
];

export default function ModuleMenu({
  onSelectModule,
  completedModules = [],
}: ModuleMenuProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-5xl block mb-3">🦁</span>
          <h1 className="text-2xl font-bold text-[#1A2744]">
            Choose Your Module
          </h1>
          <p className="text-[#1A2744]/60 mt-2 text-sm">
            Complete both modules to unlock your full composite report.
          </p>
        </div>

        {/* Module Cards */}
        <div className="space-y-4">
          {MODULES.map((mod) => {
            const isCompleted = completedModules.includes(mod.key);

            return (
              <button
                key={mod.key}
                onClick={() => !isCompleted && onSelectModule(mod.key)}
                disabled={isCompleted}
                className={`w-full text-left rounded-2xl border-2 p-6 transition-all ${
                  isCompleted
                    ? "border-green-300 bg-green-50 cursor-default"
                    : "border-[#B8892A]/20 bg-white hover:border-[#B8892A] hover:shadow-lg cursor-pointer"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{mod.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-[#1A2744]">
                        {mod.label}
                      </h2>
                      {isCompleted && (
                        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Done ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#1A2744]/60 mt-1">
                      {mod.description}
                    </p>
                    <p className="text-xs text-[#B8892A] font-medium mt-2">
                      20 adaptive items · {mod.duration}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#1A2744]/40">
            Modules are independent — you may take them on separate days.
          </p>
        </div>
      </div>
    </div>
  );
}
