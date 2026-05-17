import { getCachedGa4Bundle } from "@/server/command-center/cached-data";
import { fetchGoogleAdsSummary } from "@/services/google/ads";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const businessPayloadSchema = z.object({
  kpis: z.array(kpiMetricSchema),
  adsMessage: z.string(),
  funnel: z.array(z.object({ stage: z.string(), users: z.number() })),
});

export type BusinessPayload = z.infer<typeof businessPayloadSchema>;

export async function loadBusinessPayload(): Promise<BusinessPayload> {
  const [ga4, ads] = await Promise.all([
    getCachedGa4Bundle(),
    fetchGoogleAdsSummary(),
  ]);

  const sessions = ga4.stats?.sessions ?? 0;
  const kpis: KpiMetric[] = [
    {
      id: "sessions",
      label: "GA4 工作階段 (7日)",
      value: sessions,
      trend: "up",
      sparkline: ga4.traffic.slice(-7).map((d) => d.sessions),
      status: "ok",
    },
    {
      id: "roas",
      label: "ROAS",
      value: ads.roas,
      trend: "flat",
      sparkline: [0, 0, 0],
      status: ads.ok ? "ok" : "warn",
      aiNote: ads.message,
    },
    {
      id: "spend",
      label: "廣告支出 (今日)",
      value: ads.spendToday,
      trend: "flat",
      sparkline: [0],
      status: "ok",
    },
  ];

  return {
    kpis,
    adsMessage: ads.message,
    funnel: [
      { stage: "造訪", users: sessions },
      { stage: "互動", users: Math.round(sessions * 0.42) },
      { stage: "轉換", users: Math.round(sessions * 0.08) },
    ],
  };
}
