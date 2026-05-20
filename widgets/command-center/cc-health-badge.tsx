"use client";

import { cn } from "@/shared/lib/cn";
import { healthStyles, type HealthLevel } from "./cc-health";

export function CcHealthBadge({
  health,
  className,
}: {
  health: HealthLevel;
  className?: string;
}) {
  const s = healthStyles[health];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        s.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}
