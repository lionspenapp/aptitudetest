"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsReport from "@/components/ResultsReport";
import { useAssessmentStore } from "@/store/assessment-store";
import type { ModuleReportData } from "@/lib/reportGenerator";

export default function ResultsPage() {
  const router = useRouter();
  const { studentName, enrolledGrade, moduleResults, reset } =
    useAssessmentStore();
  const [narrative, setNarrative] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!studentName || moduleResults.length === 0) {
      router.push("/");
    }
  }, [studentName, moduleResults, router]);

  useEffect(() => {
    if (moduleResults.length === 0) return;

    const modules: ModuleReportData[] = moduleResults.map((r) => ({
      module: r.module,
      rawScore: r.rawScore,
      totalQuestions: r.totalQuestions,
      geScore: r.geScore,
      percentileBand: r.percentileBand,
      growthGap: r.growthGap,
      tierReached: r.tierReached,
      strongTypes: r.strongTypes,
      weakTypes: r.weakTypes,
    }));

    fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName,
        enrolledGrade,
        modules,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.narrative) setNarrative(data.narrative);
      })
      .catch(() => {
        // Narrative is optional — local report is complete without it.
      });
  }, [moduleResults, studentName, enrolledGrade]);

  const handleStartNew = () => {
    reset();
    router.push("/");
  };

  if (!studentName || moduleResults.length === 0) return null;

  return (
    <ResultsReport
      studentName={studentName}
      enrolledGrade={enrolledGrade}
      results={moduleResults}
      narrative={narrative}
      onStartNew={handleStartNew}
    />
  );
}
