"use client";

import { memo, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Bot } from "lucide-react";
import { GlassCard } from "@/shared/ui/glass-card";
import { Badge } from "@/shared/ui/badge";
import { CcInsightSkeletonGrid } from "@/widgets/command-center/cc-skeleton";
import type { AiInsight } from "@/types/command-center/insights";

const riskVariant = {
  info: "default",
  watch: "warn",
  high: "warn",
  critical: "error",
} as const;

const riskLabel: Record<AiInsight["riskTier"], string> = {
  info: "資訊",
  watch: "觀察",
  high: "高風險",
  critical: "嚴重",
};

function InsightField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className={highlight ? "text-cyan-200/90" : undefined}>{value}</dd>
    </div>
  );
}

function InsightCard({ insight }: { insight: AiInsight }) {
  const reduced = useReducedMotion();
  const [text, setText] = useState("");

  useEffect(() => {
    if (reduced) {
      setText(insight.summary);
      return;
    }
    let i = 0;
    const full = insight.summary;
    const timer = setInterval(() => {
      i += 2;
      setText(full.slice(0, i));
      if (i >= full.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [insight.summary, reduced]);

  return (
    <GlassCard
      glow={insight.riskTier === "critical" ? "red" : "none"}
      className="border-l-2 border-l-cyan-500/50 p-4"
    >
      <InsightHeader insight={insight} />
      <p className="mt-2 font-mono text-sm text-slate-200">{text}</p>
      <dl className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
        <InsightField label="原因分析" value={insight.rootCause} />
        <InsightField label="影響範圍" value={insight.impact} />
        <InsightField label="建議方案" value={insight.remediation} highlight />
        <InsightField label="預測影響" value={insight.predictedOutcome} />
      </dl>
    </GlassCard>
  );
}

function InsightHeader({ insight }: { insight: AiInsight }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={riskVariant[insight.riskTier]}>
        {riskLabel[insight.riskTier]}
      </Badge>
      <h3 className="text-sm font-semibold text-white">{insight.title}</h3>
    </div>
  );
}

function InsightEmptyState() {
  return (
    <GlassCard
      glow="cyan"
      className="relative overflow-hidden border-cyan-500/25 p-6"
    >
      <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-cyan-500/20 shadow-[0_0_60px_rgba(0,210,255,0.15)]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_32px_-4px_rgba(0,210,255,0.45)]">
          <Bot className="h-7 w-7 animate-pulse text-cyan-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan-400/90">
            AI 洞察中心
          </p>
          <p className="mt-2 text-sm text-slate-300">
            🤖 Gemini 代理正在後台分析近 30 天流量趨勢與 21 項串接指標…
          </p>
          <p className="mt-1 text-xs text-slate-500">
            完成後將在此顯示風險分級、根因與建議方案
          </p>
          <div className="mt-5">
            <CcInsightSkeletonGrid />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function InsightPanelInner({ insights }: { insights: AiInsight[] }) {
  if (insights.length === 0) {
    return <InsightEmptyState />;
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

export const InsightPanel = memo(InsightPanelInner);
