"use client";

import { useState } from "react";

interface SetupScreenProps {
  onStart: (studentName: string, gradeLevel: number) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim()) {
      onStart(studentName.trim(), gradeLevel);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <span className="text-6xl block mb-4">🦁</span>
          <h1 className="text-3xl font-bold text-[#1A2744] tracking-tight">
            Lion&apos;s Pen
          </h1>
          <p className="text-[#1A2744]/60 mt-2 text-sm font-medium uppercase tracking-widest">
            Aptitude Assessment
          </p>
        </div>

        {/* Setup Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-[#B8892A]/20 p-8"
        >
          <h2 className="text-xl font-semibold text-[#1A2744] mb-6">
            Student Setup
          </h2>

          <div className="space-y-5">
            {/* Name Field */}
            <div>
              <label
                htmlFor="studentName"
                className="block text-sm font-medium text-[#1A2744]/80 mb-1.5"
              >
                Student Name
              </label>
              <input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1A2744]/15 bg-[#FAF7F0] text-[#1A2744] placeholder:text-[#1A2744]/30 focus:outline-none focus:ring-2 focus:ring-[#B8892A]/40 focus:border-[#B8892A] transition-colors"
              />
            </div>

            {/* Grade Level Field */}
            <div>
              <label
                htmlFor="gradeLevel"
                className="block text-sm font-medium text-[#1A2744]/80 mb-1.5"
              >
                Enrolled Grade
              </label>
              <select
                id="gradeLevel"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-[#1A2744]/15 bg-[#FAF7F0] text-[#1A2744] focus:outline-none focus:ring-2 focus:ring-[#B8892A]/40 focus:border-[#B8892A] transition-colors"
              >
                {[3, 4, 5, 6, 7, 8].map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Button */}
          <button
            type="submit"
            disabled={!studentName.trim()}
            className="w-full mt-8 py-3.5 rounded-xl bg-[#B8892A] text-white font-semibold text-lg shadow-md hover:bg-[#9A7223] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Begin Assessment
          </button>

          <p className="text-center text-xs text-[#1A2744]/40 mt-4">
            Grades 3–8 · Adaptive · Nationally Normed
          </p>
        </form>
      </div>
    </div>
  );
}
