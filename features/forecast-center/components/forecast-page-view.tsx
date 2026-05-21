"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Info, Minus, Settings2 } from "lucide-react";
import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { GlassCard } from "@/shared/ui/glass-card";
import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildForecastFromHistory,
  type ForecastHorizon,
  type ForecastMetric,
} from "@/lib/forecast/forecast-model";
import type { ForecastPayload } from "@/server/command-center/load-forecast";
import { cn } from "@/shared/lib/cn";

const ForecastTrajectoryChart = dynamic(
  () =>
    import("@/features/forecast-center/components/forecast-trajectory-chart").then(
      (m) => m.ForecastTrajectoryChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 animate-pulse rounded-lg bg-slate-800/40" aria-hidden />
    ),
  }
);

const METRIC_TABS: { id: ForecastMetric; label: string }[] = [
  { id: "sessions", label: "工作階段" },
  { id: "pageViews", label: "瀏覽量" },
  { id: "conversions", label: "預估轉換" },
];

const HORIZONS: ForecastHorizon[] = [7, 14, 30];

const METRIC_UNIT: Record<ForecastMetric, string> = {
  sessions: "工作階段",
  pageViews: "次瀏覽",
  conversions: "次轉換",
};

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
  if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-amber-400" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

export function ForecastPageView({ data }: { data: ForecastPayload }) {
  const [metric, setMetric] = useState<ForecastMetric>("sessions");
  const [horizon, setHorizon] = useState<ForecastHorizon>(7);
  const [excludeOutliers, setExcludeOutliers] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const result = useMemo(
    () =>
      buildForecastFromHistory(data.history, {
        horizon,
        metric,
        excludeOutliers,
      }),
    [data.history, horizon, metric, excludeOutliers]
  );

  const metricLabel = METRIC_TABS.find((t) => t.id === metric)?.label ?? metric;

  return (
    <TooltipProvider>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <ModuleHeader
            title="預測中心"
            description="GA4 歷史流量與 AI 線性外推預測 — 可切換指標與預測天數"
          />
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            <Settings2 className="h-3.5 w-3.5" />
            調整預測模型
          </button>
        </div>

        {!data.ga4Ok ? (
          <GlassCard className="border-amber-500/30 p-4" glow="amber">
            <p className="text-sm text-amber-100">
              {data.ga4Message ?? "GA4 未連線，預測僅能顯示示意（請至外部串接設定修復）。"}
            </p>
          </GlassCard>
        ) : null}

        {settingsOpen ? (
          <GlassCard className="p-4">
            <h2 className="text-sm font-semibold text-white">預測模型設定</h2>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={excludeOutliers}
                onChange={(e) => setExcludeOutliers(e.target.checked)}
                className="rounded border-slate-600"
              />
              排除極端值（超過 2σ 的單日流量會被平滑）
            </label>
            <p className="mt-2 text-[11px] text-slate-500">
              目前使用線性外推；進階模型（季節性、ARIMA）可於後續版本接入。
            </p>
          </GlassCard>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {METRIC_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMetric(tab.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                metric === tab.id
                  ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-500/40"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {HORIZONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                horizon === h
                  ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-500/40"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              )}
            >
              未來 {h} 日
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <GlassCard className="p-4" glow="cyan">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                預測 {horizon} 日總{metricLabel}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-slate-500 hover:text-slate-300"
                    aria-label="模型說明"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {result.kpis.modelNote}
                  {metric === "conversions"
                    ? " · 轉換為依工作階段估算（約 2.8%），待 GA4 轉換目標接入後可改為真實值。"
                    : null}
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-[#00F2FE]">
              {result.kpis.totalProjected.toLocaleString()}
            </p>
          </GlassCard>

          <GlassCard className="p-4" glow="cyan">
            <p className="text-xs text-slate-400">預測每日平均</p>
            <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-white">
              {result.kpis.dailyAverage.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">{METRIC_UNIT[metric]} / 日</p>
          </GlassCard>

          <GlassCard className="p-4" glow="cyan">
            <p className="text-xs text-slate-400">趨勢標籤（近 3 日 vs 前 3 日）</p>
            <div className="mt-2 flex items-center gap-2">
              <TrendIcon trend={result.kpis.growthTrend} />
              <p className="text-lg font-semibold text-slate-100">
                {result.kpis.growthLabel}
              </p>
            </div>
            <Badge variant={result.kpis.growthTrend === "up" ? "ok" : "default"} className="mt-2">
              {metricLabel}
            </Badge>
          </GlassCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          <GlassCard className="p-4">
            <h2 className="mb-1 text-sm font-semibold text-white">
              流量軌跡 · 實際 + 預測
            </h2>
            <p className="mb-4 text-[11px] text-slate-500">
              左側實線為過去 7 日 GA4 實際值，右側虛線為未來 {horizon} 日預測（含信心區間）
            </p>
            <ForecastTrajectoryChart data={result.series} />
          </GlassCard>

          <GlassCard className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">數據明細</h2>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2 font-medium">日期</th>
                    <th className="pb-2 text-right font-medium">值</th>
                    <th className="pb-2 text-right font-medium">區間</th>
                  </tr>
                </thead>
                <tbody>
                  {result.forecastRows.map((row) => (
                    <tr
                      key={row.date}
                      className="border-t border-slate-800/60 text-slate-300"
                    >
                      <td className="py-2 font-mono text-slate-400">{row.date}</td>
                      <td className="py-2 text-right font-mono text-violet-200">
                        {row.value}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        ({row.lower}–{row.upper})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.forecastRows.length === 0 ? (
                <p className="py-8 text-center text-slate-500">尚無預測列</p>
              ) : null}
            </div>
          </GlassCard>
        </div>
      </div>
    </TooltipProvider>
  );
}
