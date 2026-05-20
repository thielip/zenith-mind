export type HealthLevel = "good" | "needs-improvement" | "poor";

export function lcpHealth(seconds: number): HealthLevel {
  if (seconds <= 2.5) return "good";
  if (seconds <= 4) return "needs-improvement";
  return "poor";
}

export function inpHealth(ms: number): HealthLevel {
  if (ms <= 200) return "good";
  if (ms <= 500) return "needs-improvement";
  return "poor";
}

export function clsHealth(value: number): HealthLevel {
  if (value <= 0.1) return "good";
  if (value <= 0.25) return "needs-improvement";
  return "poor";
}

export const healthStyles: Record<
  HealthLevel,
  { bar: string; badge: string; dot: string; label: string }
> = {
  good: {
    bar: "from-emerald-500 to-emerald-400",
    badge: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    label: "良好",
  },
  "needs-improvement": {
    bar: "from-amber-500 to-amber-400",
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-200",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
    label: "需改善",
  },
  poor: {
    bar: "from-red-500 to-red-400",
    badge: "border-red-500/40 bg-red-500/15 text-red-300",
    dot: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]",
    label: "不良",
  },
};
