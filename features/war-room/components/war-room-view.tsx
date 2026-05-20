"use client";

import dynamic from "next/dynamic";
import { KpiMetricCard } from "@/widgets/kpi-grid/kpi-metric-card";
import { WarRoomHero } from "@/widgets/command-shell/war-room-hero";
import { InsightPanel } from "@/widgets/insight-feed/insight-panel";
import { TerminalPanel } from "@/widgets/terminal-stream/terminal-panel";
import { GlassCard } from "@/shared/ui/glass-card";
import type { WarRoomPayload } from "@/types/command-center/module-payloads";

const GlowAreaChart = dynamic(
  () => import("@/widgets/chart-panel/glow-area-chart").then((m) => m.GlowAreaChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-lg bg-slate-800/40" aria-hidden />
    ),
  }
);

const CcIntegrationDonut = dynamic(
  () =>
    import("@/widgets/command-center/cc-integration-donut").then(
      (m) => m.CcIntegrationDonut
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 animate-pulse rounded-lg bg-slate-800/40" aria-hidden />
    ),
  }
);

export function WarRoomView({ data }: { data: WarRoomPayload }) {
  return (
    <div className="space-y-6 min-w-0">
      <WarRoomHero
        title="AI 行銷作戰中心"
        subtitle="即時串流 GA4、搜尋成效、AI 代理與 Gemini 洞察 — 預測性警報與自動化建議"
        pills={data.statusPills}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiMetricCard key={kpi.id} metric={kpi} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="p-4 xl:col-span-2" glow="cyan">
          <h2 className="mb-3 text-sm font-semibold text-white">近 30 天流量趨勢</h2>
          <GlowAreaChart data={data.trafficSeries} />
        </GlassCard>
        <GlassCard className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">串接健康</h2>
          <CcIntegrationDonut
            ok={data.integrationSummary.ok}
            missing={data.integrationSummary.missing}
            error={data.integrationSummary.error}
          />
        </GlassCard>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">AI 洞察中心</h2>
        <InsightPanel insights={data.insights} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">即時終端機</h2>
        <TerminalPanel />
      </section>
    </div>
  );
}
