"use client";

import { cn } from "@/shared/lib/cn";
import { healthStyles, type HealthLevel } from "./cc-health";

interface CcProgressBarProps {
  value: number;
  max?: number;
  health?: HealthLevel;
  label?: string;
  suffix?: string;
  className?: string;
}

export function CcProgressBar({
  value,
  max = 100,
  health = "good",
  label,
  suffix,
  className,
}: CcProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const styles = healthStyles[health];

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || suffix) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label ? <span className="text-slate-400">{label}</span> : <span />}
          {suffix ? (
            <span className="font-mono text-slate-200">{suffix}</span>
          ) : null}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            styles.bar
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
