import { getCachedHealthReport } from "@/server/command-center/cached-data";
import { fetchBigQueryHealth } from "@/services/google/bigquery";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const securityPayloadSchema = z.object({
  kpis: z.array(kpiMetricSchema),
  integrations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.string(),
      detail: z.string().optional(),
    })
  ),
});

export type SecurityPayload = z.infer<typeof securityPayloadSchema>;

export async function loadSecurityPayload(): Promise<SecurityPayload> {
  const [health, bq] = await Promise.all([getCachedHealthReport(), fetchBigQueryHealth()]);

  const kpis: KpiMetric[] = [
    {
      id: "ok",
      label: "正常串接",
      value: health.summary.ok,
      trend: "up",
      sparkline: [health.summary.ok],
      status: "ok",
    },
    {
      id: "bq",
      label: "BigQuery",
      value: bq.ok ? 1 : 0,
      trend: "flat",
      sparkline: [bq.ok ? 1 : 0],
      status: bq.ok ? "ok" : "warn",
      aiNote: bq.message,
    },
  ];

  return {
    kpis,
    integrations: health.items.map((i) => ({
      id: i.id,
      name: i.name,
      status: i.status,
      detail: i.detail,
    })),
  };
}
