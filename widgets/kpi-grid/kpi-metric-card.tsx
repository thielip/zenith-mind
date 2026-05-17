"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { GlassCard } from "@/shared/ui/glass-card";
import { Badge } from "@/shared/ui/badge";
import type { KpiMetric } from "@/types/command-center/metrics";

const SparklineMini = dynamic(
  () => import("@/widgets/kpi-grid/sparkline-mini").then((m) => m.SparklineMini),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded bg-slate-800/40" />,
  }
);

interface KpiMetricCardProps {
  metric: KpiMetric;
}

function KpiMetricCardInner({ metric }: KpiMetricCardProps) {
  const reduced = useReducedMotion();
  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <GlassCard
      glow={
        metric.status === "critical"
          ? "red"
          : metric.status === "warn"
            ? "amber"
            : "cyan"
      }
      className="relative overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-slate-400">{metric.label}</p>
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
        </span>
      </div>
      <motion.p
        className="mt-2 font-mono text-3xl font-semibold tabular-nums text-white"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {metric.value.toLocaleString()}
        {metric.unit ? (
          <span className="ml-1 text-base text-slate-400">{metric.unit}</span>
        ) : null}
      </motion.p>
      <TrendRow metric={metric} TrendIcon={TrendIcon} />
      <div className="mt-3 h-10">
        <SparklineMini values={metric.sparkline} animate={!reduced} />
      </div>
      {metric.aiNote ? (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          AI 備註：{metric.aiNote}
        </p>
      ) : null}
    </GlassCard>
  );
}

function TrendRow({
  metric,
  TrendIcon,
}: {
  metric: KpiMetric;
  TrendIcon: typeof ArrowUpRight;
}) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <Badge variant={metric.trend === "up" ? "ok" : "default"}>
        <TrendIcon className="mr-1 h-3 w-3" aria-hidden />
        {metric.changePct != null ? `${metric.changePct}%` : "—"}
      </Badge>
    </div>
  );
}

export const KpiMetricCard = memo(KpiMetricCardInner);
