import type { ProblemScenario } from "@/types/database";

interface ProblemModulePanelProps {
  scenarios: ProblemScenario[];
}

export function ProblemModulePanel({ scenarios }: ProblemModulePanelProps) {
  return (
    <div className="space-y-6">
      {scenarios.map((s, i) => (
        <div key={i} className="card border-l-4 border-l-gold">
          <h3 className="font-serif text-lg text-lapis mb-3">
            Scenario {i + 1}
          </h3>
          <p className="text-slate mb-4">{s.scenario}</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-muted">
            {s.questions.map((q, qi) => (
              <li key={qi}>{q}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
