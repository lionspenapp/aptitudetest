"use client";

import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-slate-muted">Loading…</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}
