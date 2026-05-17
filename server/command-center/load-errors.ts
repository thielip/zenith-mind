import { getCachedHealthReport } from "@/server/command-center/cached-data";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const errorsPayloadSchema = z.object({
  kpis: z.array(kpiMetricSchema),
  items: z.array(
    z.object({ service: z.string(), status: z.string(), detail: z.string().optional() })
  ),
});

export type ErrorsPayload = z.infer<typeof errorsPayloadSchema>;

export async function loadErrorsPayload(): Promise<ErrorsPayload> {
  const health = await getCachedHealthReport();
  const errorItems = health.items.filter((i) => i.status === "error");

  const kpis: KpiMetric[] = [
    {
      id: "errors",
      label: "異常服務",
      value: health.summary.error,
      trend: health.summary.error > 0 ? "down" : "flat",
      sparkline: [health.summary.error],
      status: health.summary.error > 0 ? "critical" : "ok",
    },
    {
      id: "missing",
      label: "缺漏設定",
      value: health.summary.missing,
      trend: "flat",
      sparkline: [health.summary.missing],
      status: health.summary.missing > 0 ? "warn" : "ok",
    },
  ];

  return {
    kpis,
    items: errorItems.map((i) => ({
      service: i.name,
      status: i.status,
      detail: i.detail,
    })),
  };
}
