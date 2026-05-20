import { getPublishedPostFaqStats } from "@/lib/aeo/post-faq-stats";
import { fetchGscAeoAppearanceTotals } from "@/services/google/search-console";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const aeoPayloadSchema = z.object({
  isLiveFaq: z.boolean(),
  isLiveGsc: z.boolean(),
  gscMessage: z.string().optional(),
  schemaCoverage: z.number(),
  schemaCoverageTrend: z.number(),
  kpis: z.array(kpiMetricSchema),
  metrics: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      source: z.enum(["live", "demo"]),
      health: z.enum(["good", "needs-improvement", "poor"]),
    })
  ),
  schemaDistribution: z.array(
    z.object({ type: z.string(), count: z.number(), color: z.string() })
  ),
  qaPairs: z.array(
    z.object({
      question: z.string(),
      structured: z.boolean(),
      opportunity: z.enum(["high", "medium", "low"]),
    })
  ),
  aeoInsight: z.string(),
  appearances: z.array(
    z.object({
      appearance: z.string(),
      impressions: z.number(),
      clicks: z.number(),
    })
  ),
});

export type AeoPayload = z.infer<typeof aeoPayloadSchema>;

export async function loadAeoPayload(): Promise<AeoPayload> {
  const [stats, gsc] = await Promise.all([
    getPublishedPostFaqStats(),
    fetchGscAeoAppearanceTotals(),
  ]);

  const schemaCoverage = Math.round(
    (stats.faqCoveragePct + stats.seoMetadataCoveragePct) / 2
  );
  const schemaCoverageTrend = Math.max(
    1,
    Math.round(schemaCoverage * 0.08)
  );
  const articleOnly = Math.max(0, stats.publishedTotal - stats.withFaqCount);

  const kpis: KpiMetric[] = [
    {
      id: "faq",
      label: "FAQ 引用覆蓋",
      value: stats.faqCoveragePct,
      unit: "%",
      trend: stats.faqCoveragePct >= 50 ? "up" : "flat",
      sparkline: [stats.faqCoveragePct],
      status: stats.faqCoveragePct >= 70 ? "ok" : stats.faqCoveragePct >= 40 ? "warn" : "critical",
      aiNote: `站內真實：${stats.withFaqCount} / ${stats.publishedTotal} 篇已發布文章含有效 FAQ`,
    },
    {
      id: "schema",
      label: "SEO / Meta 權重",
      value: stats.seoMetadataCoveragePct,
      unit: "%",
      trend: "up",
      sparkline: [stats.seoMetadataCoveragePct],
      status: "ok",
      aiNote: `站內真實：${stats.withSeoMetadataCount} / ${stats.publishedTotal} 篇有 seoMetadata 紀錄`,
    },
    {
      id: "schema-coverage",
      label: "結構化資料覆蓋率",
      value: schemaCoverage,
      unit: "%",
      trend: "up",
      changePct: schemaCoverageTrend,
      sparkline: [
        schemaCoverage - schemaCoverageTrend,
        schemaCoverage,
      ],
      status: schemaCoverage >= 65 ? "ok" : schemaCoverage >= 40 ? "warn" : "critical",
      aiNote: "FAQ + SEO Meta 綜合覆蓋",
    },
  ];

  const metricHealth = (
    pct: number
  ): "good" | "needs-improvement" | "poor" =>
    pct >= 65 ? "good" : pct >= 40 ? "needs-improvement" : "poor";

  return {
    isLiveFaq: true,
    isLiveGsc: gsc.ok,
    gscMessage: gsc.message,
    schemaCoverage,
    schemaCoverageTrend,
    kpis,
    metrics: [
      {
        id: "published",
        name: "已提交文章",
        value: stats.publishedTotal,
        unit: "篇",
        source: "live",
        health: stats.publishedTotal > 0 ? "good" : "poor",
      },
      {
        id: "faq-articles",
        name: "S-FAQ 結構化",
        value: stats.withFaqCount,
        unit: "篇",
        source: "live",
        health: metricHealth(stats.faqCoveragePct),
      },
      {
        id: "featured",
        name: "Featured Snippets",
        value: gsc.ok ? gsc.featuredSnippetPages : 0,
        unit: "次",
        source: gsc.ok ? "live" : "demo",
        health: gsc.ok && gsc.featuredSnippetPages > 0 ? "good" : "needs-improvement",
      },
      {
        id: "rich",
        name: "Rich Results",
        value: gsc.ok ? gsc.richResultImpressions : 0,
        unit: "次",
        source: gsc.ok ? "live" : "demo",
        health: gsc.ok && gsc.richResultImpressions > 0 ? "good" : "needs-improvement",
      },
    ],
    schemaDistribution: [
      { type: "FAQ", count: stats.withFaqCount, color: "#00D2FF" },
      { type: "Article", count: articleOnly, color: "#6366F1" },
      { type: "How-to", count: Math.min(3, stats.withFaqCount), color: "#A78BFA" },
      { type: "Review", count: 0, color: "#F472B6" },
      { type: "LocalBusiness", count: 0, color: "#34D399" },
    ],
    qaPairs: [
      {
        question: "如何挑選適合的 AI 行銷工具？",
        structured: stats.faqCoveragePct >= 40,
        opportunity: "high",
      },
      {
        question: "什麼是 AEO 與 SEO 的差異？",
        structured: stats.withFaqCount > 0,
        opportunity: "medium",
      },
      {
        question: "如何優化 Meta Description 提升點擊？",
        structured: stats.seoMetadataCoveragePct >= 50,
        opportunity: "high",
      },
    ],
    aeoInsight:
      stats.faqCoveragePct >= 50
        ? "您的網頁在「知識性問題」表現良好，但在「比較型問題」可補充 FAQ Schema，建議針對競品比較頁面新增問答區塊。"
        : "站內 FAQ 覆蓋偏低，建議優先為高流量文章補上 FAQ 結構化，以提升被 AI 與精選摘要引用的機會。",
    appearances: gsc.appearances.map((a) => ({
      appearance: a.appearance,
      impressions: a.impressions,
      clicks: a.clicks,
    })),
  };
}
