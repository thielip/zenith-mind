"use client";

import { Bot, Sparkles } from "lucide-react";
import { GlassCard } from "@/shared/ui/glass-card";
import { cn } from "@/shared/lib/cn";

export interface InsightItem {
  icon?: string;
  title: string;
  body: string;
  priority?: "high" | "medium" | "low";
}

interface CcAiInsightBlockProps {
  title: string;
  subtitle?: string;
  items: InsightItem[];
  className?: string;
}

const priorityBorder = {
  high: "border-l-red-500/60",
  medium: "border-l-amber-500/60",
  low: "border-l-cyan-500/60",
};

export function CcAiInsightBlock({
  title,
  subtitle,
  items,
  className,
}: CcAiInsightBlockProps) {
  return (
    <GlassCard
      glow="cyan"
      className={cn(
        "relative overflow-hidden border-cyan-500/25 p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_24px_-4px_rgba(0,210,255,0.4)]">
          <Bot className="h-6 w-6 text-cyan-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <Sparkles className="h-4 w-4 text-cyan-400/80" aria-hidden />
          </div>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          ) : null}
          <ul className="mt-4 space-y-3">
            {items.map((item, i) => (
              <li
                key={i}
                className={cn(
                  "rounded-lg border border-slate-800/60 bg-slate-950/50 px-4 py-3 border-l-2",
                  priorityBorder[item.priority ?? "low"]
                )}
              >
                <p className="text-sm font-medium text-slate-100">
                  {item.icon ? `${item.icon} ` : null}
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}
