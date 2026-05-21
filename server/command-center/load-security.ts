import { getCachedHealthReport } from "@/server/command-center/cached-data";
import { buildIntegrationDiagnostics } from "@/lib/admin/integration-groups";
import { fetchBigQueryHealth } from "@/services/google/bigquery";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const securityPayloadSchema = z.object({
  checkedAt: z.string(),
  kpis: z.array(kpiMetricSchema),
  integrations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      status: z.enum(["ok", "missing", "error"]),
      detail: z.string().optional(),
      missing: z.array(z.string()),
    })
  ),
  diagnostics: z.array(z.string()),
  summary: z.object({
    ok: z.number(),
    missing: z.number(),
    error: z.number(),
  }),
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
      id: "missing",
      label: "缺漏設定",
      value: health.summary.missing,
      trend: "flat",
      sparkline: [health.summary.missing],
      status: health.summary.missing > 0 ? "warn" : "ok",
    },
    {
      id: "errors",
      label: "異常服務",
      value: health.summary.error,
      trend: health.summary.error > 0 ? "down" : "flat",
      sparkline: [health.summary.error],
      status: health.summary.error > 0 ? "critical" : "ok",
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

  const integrations = health.items.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    status: i.status,
    detail: i.detail,
    missing: i.missing,
  }));

  const diagnostics = buildIntegrationDiagnostics(health.items);
  if (!bq.ok && bq.message) {
    diagnostics.unshift(`BigQuery：${bq.message}`);
  }

  return {
    checkedAt: health.checkedAt,
    kpis,
    integrations,
    diagnostics,
    summary: health.summary,
  };
}
