import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center gap-12 px-8 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-5xl">🦁</span>
          <h1 className="text-4xl font-bold tracking-tight">
            Lion&apos;s Pen
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
            Nationally-normed adaptive aptitude assessment for Grades&nbsp;3–8.
            Measure cognitive reasoning — not curriculum knowledge.
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-sm">
          <Link
            href="/assessment"
            className="flex h-12 items-center justify-center rounded-full bg-foreground text-background font-medium transition-colors hover:opacity-90"
          >
            Start Assessment
          </Link>
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <p className="text-2xl font-bold">20</p>
              <p className="text-xs text-zinc-500">Questions / Module</p>
            </div>
            <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <p className="text-2xl font-bold">4</p>
              <p className="text-xs text-zinc-500">Adaptive Tiers</p>
            </div>
            <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <p className="text-2xl font-bold">GE</p>
              <p className="text-xs text-zinc-500">Grade Equivalent</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-zinc-400 dark:text-zinc-600">
          Quantitative Reasoning · Verbal Reasoning · Quarterly Growth Tracking
        </div>
      </main>
    </div>
  );
}
