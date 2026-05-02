"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsReport from "@/components/ResultsReport";
import { useAssessmentStore } from "@/store/assessment-store";

export default function ResultsPage() {
  const router = useRouter();
  const { studentName, enrolledGrade, results, reset } = useAssessmentStore();
  const [narrative, setNarrative] = useState<string | undefined>(undefined);

  // Redirect if no results
  useEffect(() => {
    if (!studentName || results.length === 0) {
      router.push("/");
    }
  }, [studentName, results, router]);

  // Attempt to generate AI narrative (optional — works only with API key)
  useEffect(() => {
    if (results.length === 0) return;

    const quantResult = results.find((r) => r.module === "quantitative");
    const verbalResult = results.find((r) => r.module === "verbal");
    const compositeGE =
      results.length === 2
        ? Math.round(((results[0].geScore + results[1].geScore) / 2) * 10) / 10
        : results[0]?.geScore ?? 0;

    const allStrong = results.flatMap((r) => r.strongTypes);
    const allWeak = results.flatMap((r) => r.weakTypes);

    fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName,
        enrolledGrade,
        quantitativeGE: quantResult?.geScore ?? null,
        verbalGE: verbalResult?.geScore ?? null,
        compositeGE,
        growthGap: Math.round((compositeGE - enrolledGrade) * 10) / 10,
        strengths: allStrong,
        growthAreas: allWeak,
      }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.narrative) setNarrative(data.narrative);
      })
      .catch(() => {
        // Narrative is optional — local report is complete without it
      });
  }, [results, studentName, enrolledGrade]);

  const handleStartNew = () => {
    reset();
    router.push("/");
  };

  if (!studentName || results.length === 0) return null;

  return (
    <ResultsReport
      studentName={studentName}
      enrolledGrade={enrolledGrade}
      results={results}
      narrative={narrative}
      onStartNew={handleStartNew}
    />
  );
}
