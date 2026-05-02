"use client";

import { useRouter } from "next/navigation";
import SetupScreen from "@/components/SetupScreen";
import { useAssessmentStore } from "@/store/assessment-store";

export default function Home() {
  const router = useRouter();
  const { setStudent } = useAssessmentStore();

  const handleStart = (studentName: string, gradeLevel: number) => {
    setStudent(studentName, gradeLevel);
    router.push("/assessment");
  };

  return <SetupScreen onStart={handleStart} />;
}
