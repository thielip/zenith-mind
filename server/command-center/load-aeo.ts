import { getPublishedPostFaqStats } from "@/lib/aeo/post-faq-stats";
import { fetchGscAeoAppearanceTotals } from "@/services/google/search-console";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const aeoPayloadSchema = z.object({
  isLiveFaq: z.boolean(),
  isLiveGsc: z.boolean(),
  gscMessage: z.string().optional(),
  kpis: z.array(kpiMetricSchema),
  metrics: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      source: z.enum(["live", "demo"]),
    })
  ),
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

  const kpis: KpiMetric[] = [
    {
      id: "faq",
      label: "FAQ 結構化覆蓋率",
      value: stats.faqCoveragePct,
      unit: "%",
      trend: stats.faqCoveragePct >= 50 ? "up" : "flat",
      sparkline: [stats.faqCoveragePct],
      status: stats.faqCoveragePct >= 70 ? "ok" : stats.faqCoveragePct >= 40 ? "warn" : "critical",
      aiNote: `站內真實：${stats.withFaqCount} / ${stats.publishedTotal} 篇已發布文章含有效 FAQ`,
    },
    {
      id: "schema",
      label: "SEO Meta 覆蓋",
      value: stats.seoMetadataCoveragePct,
      unit: "%",
      trend: "up",
      sparkline: [stats.seoMetadataCoveragePct],
      status: "ok",
      aiNote: `站內真實：${stats.withSeoMetadataCount} / ${stats.publishedTotal} 篇有 seoMetadata 紀錄`,
    },
  ];

  if (gsc.ok) {
    kpis.push({
      id: "gsc-rich",
      label: "GSC Rich Results 曝光 (28D)",
      value: gsc.richResultImpressions,
      trend: gsc.richResultImpressions > 0 ? "up" : "flat",
      sparkline: [gsc.richResultImpressions],
      status: gsc.richResultImpressions > 0 ? "ok" : "warn",
      aiNote: `Search Console searchAppearance，點擊 ${gsc.richResultClicks}`,
    });
  }

  return {
    isLiveFaq: true,
    isLiveGsc: gsc.ok,
    gscMessage: gsc.message,
    kpis,
    metrics: [
      {
        name: "已發布文章",
        value: stats.publishedTotal,
        unit: "篇",
        source: "live",
      },
      {
        name: "含 FAQ 文章",
        value: stats.withFaqCount,
        unit: "篇",
        source: "live",
      },
      {
        name: "Featured Snippets 曝光 (GSC)",
        value: gsc.ok ? gsc.featuredSnippetPages : 0,
        unit: "次",
        source: gsc.ok ? "live" : "demo",
      },
      {
        name: "Rich Results 曝光 (GSC)",
        value: gsc.ok ? gsc.richResultImpressions : 0,
        unit: "次",
        source: gsc.ok ? "live" : "demo",
      },
    ],
    appearances: gsc.appearances.map((a) => ({
      appearance: a.appearance,
      impressions: a.impressions,
      clicks: a.clicks,
    })),
  };
}
