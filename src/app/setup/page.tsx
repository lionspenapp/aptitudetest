"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavHeader } from "@/components/NavHeader";
import { createClient } from "@/lib/supabase-client";
import { useInscribeStore } from "@/store/inscribe-store";
import type { CurriculumProfile, CurriculumUnit, ExamFormat } from "@/types/database";

export default function SetupPage() {
  const router = useRouter();
  const setUser = useInscribeStore((s) => s.setUser);

  const [profiles, setProfiles] = useState<CurriculumProfile[]>([]);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [profileId, setProfileId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [questionCount, setQuestionCount] = useState(25);
  const [examFormat, setExamFormat] = useState<ExamFormat>("multiple_choice");
  const [examTimestamp, setExamTimestamp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const subRes = await fetch("/api/subscription");
      const subData = await subRes.json();
      setUser(user.id, subData.tier ?? "free");
      setAuthChecked(true);

      const res = await fetch("/api/curriculum");
      const data = await res.json();
      setProfiles(data.profiles ?? []);
    }
    init();
  }, [router, setUser]);

  useEffect(() => {
    if (!profileId) {
      setUnits([]);
      setUnitId("");
      return;
    }
    fetch(`/api/curriculum?profileId=${profileId}`)
      .then((r) => r.json())
      .then((data) => setUnits(data.units ?? []));
  }, [profileId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId || !unitId || !examTimestamp) {
      setError("Please complete all fields.");
      return;
    }

    setLoading(true);
    setError("");

    const profile = profiles.find((p) => p.id === profileId);
    const unit = units.find((u) => u.id === unitId);

    if (!profile || !unit) {
      setError("Invalid selection.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        unitId,
        courseLevel: profile.name,
        topicTitle: unit.title,
        questionCount,
        examFormat,
        examTimestamp: new Date(examTimestamp).toISOString(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create session");
      setLoading(false);
      return;
    }

    router.push(`/study/${data.sessionId}/spaced`);
  }

  if (!authChecked) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <NavHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="font-serif text-3xl text-lapis-dark mb-2">
          Zero-Friction Setup
        </h1>
        <p className="text-slate-muted mb-8">
          Pick your course, unit, and exam constraints. InScribe handles the rest.
        </p>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="label-text" htmlFor="profile">Course Profile</label>
            <select
              id="profile"
              className="input-field"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              required
            >
              <option value="">Select a course…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.framework})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text" htmlFor="unit">Unit / Module</label>
            <select
              id="unit"
              className="input-field"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              required
              disabled={!profileId}
            >
              <option value="">Select a unit…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unit_number}: {u.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text" htmlFor="count">Question Count</label>
            <input
              id="count"
              type="number"
              className="input-field"
              min={5}
              max={100}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <span className="label-text">Exam Format</span>
            <div className="space-y-2 mt-2">
              {(
                [
                  ["multiple_choice", "Multiple Choice"],
                  ["short_answer", "Short Answer"],
                  ["mixed_frq", "Mixed Free Response / FRQ"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="examFormat"
                    value={value}
                    checked={examFormat === value}
                    onChange={() => setExamFormat(value)}
                    className="accent-gold"
                  />
                  <span className="text-slate">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label-text" htmlFor="examDate">Exam Date & Time</label>
            <input
              id="examDate"
              type="datetime-local"
              className="input-field"
              value={examTimestamp}
              onChange={(e) => setExamTimestamp(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Generating study pack…" : "Begin Spaced Learning Protocol"}
          </button>
        </form>
      </main>
    </div>
  );
}
