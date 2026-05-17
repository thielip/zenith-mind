import { getCachedGa4Bundle } from "@/server/command-center/cached-data";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const trafficPayloadSchema = z.object({
  kpis: z.array(kpiMetricSchema),
  series: z.array(
    z.object({ date: z.string(), sessions: z.number(), pageViews: z.number() })
  ),
  topPages: z.array(
    z.object({ path: z.string(), title: z.string(), views: z.number() })
  ),
});

export type TrafficPayload = z.infer<typeof trafficPayloadSchema>;

export async function loadTrafficPayload(): Promise<TrafficPayload> {
  const ga4 = await getCachedGa4Bundle();

  const kpis: KpiMetric[] = [
    {
      id: "live",
      label: "即時使用者",
      value: ga4.realtimeUsers,
      trend: "up",
      sparkline: ga4.traffic.slice(-7).map((d) => d.users),
      status: ga4.reportingProbe.ok ? "ok" : "critical",
    },
    {
      id: "pv",
      label: "7D 瀏覽量",
      value: ga4.stats?.screenPageViews ?? 0,
      trend: "up",
      sparkline: ga4.traffic.slice(-7).map((d) => d.pageViews),
      status: "ok",
    },
  ];

  return {
    kpis,
    series: ga4.traffic.map((d) => ({
      date: d.date,
      sessions: d.sessions,
      pageViews: d.pageViews,
    })),
    topPages: ga4.topPages.map((p) => ({
      path: p.path,
      title: p.title,
      views: p.views,
    })),
  };
}
