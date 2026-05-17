import { getPublishedPostFaqStats } from "@/lib/aeo/post-faq-stats";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const aeoPayloadSchema = z.object({
  isLiveFaq: z.boolean(),
  kpis: z.array(kpiMetricSchema),
  metrics: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      source: z.enum(["live", "demo"]),
    })
  ),
});

export type AeoPayload = z.infer<typeof aeoPayloadSchema>;

export async function loadAeoPayload(): Promise<AeoPayload> {
  const stats = await getPublishedPostFaqStats();

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

  return {
    isLiveFaq: true,
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
        name: "Featured Snippets（示範）",
        value: 0,
        unit: "頁",
        source: "demo",
      },
      {
        name: "Rich Results（示範）",
        value: 0,
        unit: "項",
        source: "demo",
      },
    ],
  };
}
