"use client";

import dynamic from "next/dynamic";
import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { KpiMetricCard } from "@/widgets/kpi-grid/kpi-metric-card";
import { GlassCard } from "@/shared/ui/glass-card";
import { DemoBanner } from "@/shared/ui/demo-banner";
import { Badge } from "@/shared/ui/badge";
import { CcProgressBar } from "@/widgets/command-center/cc-progress-bar";
import { CcAiInsightBlock } from "@/widgets/command-center/cc-ai-insight-block";
import type { GeoPayload } from "@/types/command-center/module-payloads";
import { cn } from "@/shared/lib/cn";

const CcRadarChart = dynamic(
  () =>
    import("@/widgets/command-center/cc-radar-chart").then((m) => m.CcRadarChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-slate-800/40" /> }
);

const citationStatusLabel = {
  core: { text: "核心推薦", variant: "ok" as const },
  extended: { text: "延伸閱讀", variant: "cyan" as const },
  none: { text: "未提及", variant: "warn" as const },
};

const engineBadgeColors: Record<string, string> = {
  ChatGPT: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  Gemini: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  Claude: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  Perplexity: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  "Google AIO": "border-amber-500/40 bg-amber-500/10 text-amber-200",
};

function buildGeoInsights(data: GeoPayload) {
  const perplexitySov =
    data.aiEngineSov.find((e) => e.name === "Perplexity")?.sov ?? 0;
  const schema = data.schemaCoverage;
  const items: {
    icon?: string;
    title: string;
    body: string;
    priority: "high" | "medium" | "low";
  }[] = [];

  if (perplexitySov < 55) {
    const hasSiteSchema = schema?.siteOrgWebSite ?? true;
    const faqPct = schema?.faqCoveragePct ?? 0;
    const types = schema?.schemaTypesDeployed?.join("、") ?? "Organization、WebSite、Article";

    if (hasSiteSchema && faqPct < 40) {
      items.push({
        icon: "💡",
        title: "Perplexity 能見度偏低",
        body: `估算能見度 ${perplexitySov}/100。全站已部署 ${types} 等 JSON-LD，但已發布文章 FAQ 覆蓋僅 ${faqPct}% — 建議在更多文章加入問答式（FAQ）區塊與 SEO Meta，以提升 AI 引用率。`,
        priority: "high",
      });
    } else if (!hasSiteSchema) {
      items.push({
        icon: "💡",
        title: "Perplexity 能見度偏低",
        body: `估算能見度 ${perplexitySov}/100。請確認首頁／版型已輸出 Organization、WebSite 等 Schema.org JSON-LD。`,
        priority: "high",
      });
    } else {
      items.push({
        icon: "💡",
        title: "Perplexity 能見度可再提升",
        body: `估算能見度 ${perplexitySov}/100（結構化準備度 ${schema?.readinessPct ?? "—"}%）。可持續擴充 FAQ、更新 Article 日期，並考慮 Otterly / Semrush API 取得第三方即時數據。`,
        priority: "medium",
      });
    }
  }

  items.push({
    title: "GSC 曝光與站內 FAQ 協同",
    body: data.note ?? "持續優化 FAQ 與 SEO Meta 覆蓋，可同步提升 Google 搜尋與生成式引用準備度。",
    priority: "medium",
  });

  if (schema) {
    items.push({
      title: "Schema.org 覆蓋快照",
      body: `已發布 ${schema.publishedTotal} 篇 · FAQ ${schema.withFaqCount} 篇（${schema.faqCoveragePct}%）· SEO Meta ${schema.seoMetadataCoveragePct}% · 類型：${schema.schemaTypesDeployed.join("、")}`,
      priority: "low",
    });
  }

  return items;
}

export function GeoPageView({ data }: { data: GeoPayload }) {
  const radarData = data.aiEngineSov.map((e) => ({
    subject: e.name.replace("Google AIO", "Google"),
    value: e.sov,
  }));

  const geoInsights = buildGeoInsights(data);

  return (
    <div className="space-y-6 min-w-0">
      <ModuleHeader
        title="GEO 情報"
        description="生成式引擎能見度、Share of Voice 與 AI 引用"
      />
      {data.isDemo ? (
        <DemoBanner
          title="Demo 示範資料 / 待接 API"
          description="請設定 OTTERLY_API_KEY 或 SEMRUSH_API_KEY 以顯示各 AI 引擎即時能見度。"
        />
      ) : data.note ? (
        <DemoBanner
          title="GSC + 站內真實指標 + AI 估算"
          description={data.note}
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((k) => (
          <KpiMetricCard key={k.id} metric={k} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard className="p-4" glow="cyan">
          <h2 className="mb-4 text-sm font-semibold text-white">AI 引擎能見度</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-2 text-left">來源</th>
                <th className="pb-2 text-right">能見度</th>
                <th className="pb-2 text-right">SoV</th>
                <th className="pb-2 text-right">引用</th>
              </tr>
            </thead>
            <tbody>
              {data.engines.map((e) => (
                <tr key={e.name} className="border-t border-slate-800/60">
                  <td className="py-3 text-slate-200">{e.name}</td>
                  <td className="py-3">
                    <CcProgressBar
                      value={e.visibility}
                      max={100}
                      health={
                        e.visibility >= 70
                          ? "good"
                          : e.visibility >= 40
                            ? "needs-improvement"
                            : "poor"
                      }
                      suffix={`${e.visibility}`}
                    />
                  </td>
                  <td className="py-3">
                    <CcProgressBar
                      value={typeof e.shareOfVoice === "number" ? Math.min(100, e.shareOfVoice) : 0}
                      max={100}
                      health="good"
                      suffix={`${e.shareOfVoice}`}
                    />
                  </td>
                  <td className="py-3 text-right font-mono text-slate-300">
                    {e.citations.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
        <GlassCard className="p-4">
          <h2 className="mb-1 text-sm font-semibold text-white">
            AI 引擎 Share of Voice
          </h2>
          <p className="mb-3 text-[11px] text-slate-500">
            雷達圖為結構化準備度估算（待第三方 API 可替換為即時 SoV）
          </p>
          <CcRadarChart data={radarData} height={280} />
        </GlassCard>
      </div>
      <GlassCard className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">
          AI 引擎引用情境分析
        </h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="pb-2 text-left">關鍵字 / 問題</th>
              <th className="pb-2 text-left">AI 引擎</th>
              <th className="pb-2 text-right">引用狀態</th>
            </tr>
          </thead>
          <tbody>
            {data.citationQueries.map((row) => {
              const st = citationStatusLabel[row.status];
              return (
                <tr key={row.query} className="border-t border-slate-800/60">
                  <td className="py-3 text-slate-200">{row.query}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {row.engines.map((eng) => (
                        <span
                          key={eng}
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            engineBadgeColors[eng] ??
                              "border-slate-600 bg-slate-800/80 text-slate-300"
                          )}
                        >
                          {eng}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant={st.variant}>{st.text}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>
      <CcAiInsightBlock
        title="GEO 戰術智慧建議"
        subtitle="依能見度與結構化覆蓋產生的戰術提示"
        items={geoInsights}
      />
    </div>
  );
}
