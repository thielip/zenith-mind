"use client";

import { cn } from "@/shared/lib/cn";

export function CcSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60",
        className
      )}
    />
  );
}

export function CcInsightSkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 backdrop-blur-md"
        >
          <CcSkeleton className="mb-3 h-3 w-24" />
          <CcSkeleton className="mb-2 h-4 w-full" />
          <CcSkeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}
