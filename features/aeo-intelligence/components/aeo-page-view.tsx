"use client";

import dynamic from "next/dynamic";
import {
  FileText,
  HelpCircle,
  Sparkles,
  Star,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { KpiMetricCard } from "@/widgets/kpi-grid/kpi-metric-card";
import { GlassCard } from "@/shared/ui/glass-card";
import { DemoBanner } from "@/shared/ui/demo-banner";
import { Badge } from "@/shared/ui/badge";
import { CcProgressBar } from "@/widgets/command-center/cc-progress-bar";
import { CcHealthBadge } from "@/widgets/command-center/cc-health-badge";
import type { AeoPayload } from "@/server/command-center/load-aeo";
import { cn } from "@/shared/lib/cn";

const CcDonutChart = dynamic(
  () =>
    import("@/widgets/command-center/cc-donut-chart").then((m) => m.CcDonutChart),
  { ssr: false, loading: () => <div className="h-52 animate-pulse rounded-lg bg-slate-800/40" /> }
);

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  published: FileText,
  "faq-articles": HelpCircle,
  featured: Star,
  rich: Zap,
};

const opportunityVariant = {
  high: "ok",
  medium: "warn",
  low: "default",
} as const;

export function AeoPageView({ data }: { data: AeoPayload }) {
  const hasDemoMetrics = data.metrics.some((m) => m.source === "demo");
  const distributionTotal = data.schemaDistribution.reduce((a, s) => a + s.count, 0);

  return (
    <div className="space-y-6 min-w-0">
      <ModuleHeader
        title="AEO 情報"
        description="回答引擎優化、Schema 與站內 FAQ 結構化覆蓋"
      />
      <DemoBanner
        title={
          data.isLiveGsc && !hasDemoMetrics
            ? "站內 + Search Console 真實數據"
            : "站內真實指標 + GSC 待連線"
        }
        description={
          data.isLiveGsc
            ? "FAQ / SEO Meta 來自已發布文章；Featured Snippets / Rich Results 來自 GSC searchAppearance（28 日）。"
            : `FAQ / SEO Meta 為站內真實數據。GSC：${data.gscMessage ?? "尚未連線"}`
        }
        className={
          data.isLiveGsc && !hasDemoMetrics
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
            : undefined
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((k) => (
          <KpiMetricCard key={k.id} metric={k} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <GlassCard className="p-4" glow="cyan">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">AEO 攻略 · 即時健康診斷</h2>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                儀表
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.metrics.map((m) => {
                const Icon = metricIcons[m.id] ?? FileText;
                return (
                  <div
                    key={m.id}
                    className="rounded-lg border border-slate-800/60 bg-slate-950/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-cyan-400/80" aria-hidden />
                        <span className="text-xs text-slate-400">{m.name}</span>
                      </div>
                      <CcHealthBadge health={m.health} />
                    </div>
                    <p className="mt-2 font-mono text-lg text-white">
                      {m.value.toLocaleString()}
                      <span className="ml-1 text-sm text-slate-500">{m.unit}</span>
                    </p>
                    <CcProgressBar
                      className="mt-2"
                      value={m.unit === "%" ? m.value : Math.min(100, m.value * 5)}
                      max={100}
                      health={m.health}
                    />
                    <span
                      className={cn(
                        "mt-2 inline-block rounded px-1.5 py-0.5 text-[10px]",
                        m.source === "live"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      )}
                    >
                      {m.source === "live" ? "真實" : "待 GSC"}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
          {data.appearances.length > 0 ? (
            <GlassCard className="p-4">
              <h2 className="mb-3 text-sm font-semibold text-white">
                GSC 搜尋外觀 (28D)
              </h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-2 text-left">外觀類型</th>
                    <th className="pb-2 text-right">曝光</th>
                    <th className="pb-2 text-right">點擊</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appearances.map((a) => (
                    <tr key={a.appearance} className="border-t border-slate-800/60">
                      <td className="py-2 text-slate-200">{a.appearance}</td>
                      <td className="py-2 text-right font-mono">
                        {a.impressions.toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {a.clicks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          ) : null}
        </div>
        <GlassCard className="p-4 xl:col-span-1">
          <h2 className="mb-1 text-sm font-semibold text-white">
            Schema 佈局分佈
          </h2>
          <p className="mb-3 text-[11px] text-slate-500">
            覆蓋率 {data.schemaCoverage}% · 較上期 +{data.schemaCoverageTrend}%
          </p>
          <CcDonutChart
            segments={data.schemaDistribution.map((s) => ({
              name: s.type,
              value: s.count,
              color: s.color,
            }))}
            centerValue={`${data.schemaCoverage}%`}
            centerLabel="覆蓋"
            size={200}
          />
          <ul className="mt-4 space-y-2 text-xs">
            {data.schemaDistribution.map((s) => (
              <li key={s.type} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }}
                  />
                  {s.type}
                </span>
                <span className="font-mono text-slate-200">
                  {s.count}
                  {distributionTotal > 0 ? (
                    <span className="ml-1 text-slate-600">
                      ({Math.round((s.count / distributionTotal) * 100)}%)
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
      <GlassCard className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">
          重點 AEO 問答對
        </h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="pb-2 text-left">目標問題</th>
              <th className="pb-2 text-center">結構化</th>
              <th className="pb-2 text-right">精選機會</th>
            </tr>
          </thead>
          <tbody>
            {data.qaPairs.map((q) => (
              <tr key={q.question} className="border-t border-slate-800/60">
                <td className="py-3 text-slate-200">{q.question}</td>
                <td className="py-3 text-center">
                  {q.structured ? (
                    <Badge variant="ok" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      已標記
                    </Badge>
                  ) : (
                    <Badge variant="warn">待補</Badge>
                  )}
                </td>
                <td className="py-3 text-right">
                  <Badge variant={opportunityVariant[q.opportunity]}>
                    {q.opportunity === "high"
                      ? "高"
                      : q.opportunity === "medium"
                        ? "中"
                        : "低"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      <GlassCard
        glow="cyan"
        className="relative overflow-hidden border-cyan-500/30 p-6 shadow-[0_0_40px_-12px_rgba(0,210,255,0.25)]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-cyan-400/20" />
        <div className="relative flex gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-cyan-400" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-cyan-100">
              AI 自動生成的 AEO 優化短評
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {data.aeoInsight}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
