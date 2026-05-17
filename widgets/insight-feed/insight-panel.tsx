"use client";

import { memo, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { GlassCard } from "@/shared/ui/glass-card";
import { Badge } from "@/shared/ui/badge";
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

function InsightPanelInner({ insights }: { insights: AiInsight[] }) {
  if (insights.length === 0) {
    return (
      <GlassCard className="p-8 text-center text-sm text-slate-500">
        目前無 AI 洞察，系統持續監控中。
      </GlassCard>
    );
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
