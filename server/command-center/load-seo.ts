import { getCachedGa4Bundle } from "@/server/command-center/cached-data";
import { fetchSearchConsoleSummary } from "@/services/google/search-console";
import type { SeoPayload } from "@/types/command-center/module-payloads";

export type { SeoPayload };
import type { KpiMetric } from "@/types/command-center/metrics";

export async function loadSeoPayload(): Promise<SeoPayload> {
  const [ga4, gsc] = await Promise.all([
    getCachedGa4Bundle(),
    fetchSearchConsoleSummary(),
  ]);

  const kpis: KpiMetric[] = [
    {
      id: "organic-sessions",
      label: "自然工作階段 (7日)",
      value: ga4.stats?.sessions ?? 0,
      trend: "up",
      sparkline: ga4.traffic.slice(-7).map((d) => d.sessions),
      status: "ok",
    },
    {
      id: "gsc-clicks",
      label: "GSC 點擊 (28D)",
      value: gsc.totals.clicks,
      trend: gsc.ok ? "up" : "flat",
      sparkline: [gsc.totals.clicks, gsc.totals.impressions / 100, gsc.totals.clicks],
      status: gsc.ok ? "ok" : "warn",
      aiNote: gsc.message,
    },
    {
      id: "ctr",
      label: "GSC CTR",
      value: Math.round(gsc.totals.ctr * 10000) / 100,
      unit: "%",
      trend: "flat",
      sparkline: [2, 2.5, gsc.totals.ctr * 100],
      status: "ok",
    },
    {
      id: "impressions",
      label: "曝光",
      value: gsc.totals.impressions,
      trend: "up",
      sparkline: [gsc.totals.impressions],
      status: "ok",
    },
  ];

  return {
    gscOk: gsc.ok,
    gscMessage: gsc.message,
    kpis,
    keywords: gsc.queries,
    landingPages: gsc.landingPages,
    cwv: { lcp: 2.1, inp: 180, cls: 0.08 },
    indexCoverage: gsc.ok ? 92 : 0,
    errorHealth: { notFound: 3, serverError: 0 },
  };
}
