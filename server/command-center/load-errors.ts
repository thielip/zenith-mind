import { getCachedHealthReport } from "@/server/command-center/cached-data";
import { buildIntegrationDiagnostics } from "@/lib/admin/integration-groups";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const errorsPayloadSchema = z.object({
  checkedAt: z.string(),
  kpis: z.array(kpiMetricSchema),
  items: z.array(
    z.object({
      id: z.string(),
      service: z.string(),
      status: z.enum(["ok", "missing", "error"]),
      detail: z.string().optional(),
      missing: z.array(z.string()),
    })
  ),
  missingItems: z.array(
    z.object({
      id: z.string(),
      service: z.string(),
      missing: z.array(z.string()),
    })
  ),
  diagnostics: z.array(z.string()),
});

export type ErrorsPayload = z.infer<typeof errorsPayloadSchema>;

export async function loadErrorsPayload(): Promise<ErrorsPayload> {
  const health = await getCachedHealthReport();
  const errorItems = health.items.filter((i) => i.status === "error");
  const missingItems = health.items.filter((i) => i.status === "missing");

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
    checkedAt: health.checkedAt,
    kpis,
    items: errorItems.map((i) => ({
      id: i.id,
      service: i.name,
      status: i.status,
      detail: i.detail,
      missing: i.missing,
    })),
    missingItems: missingItems.map((i) => ({
      id: i.id,
      service: i.name,
      missing: i.missing,
    })),
    diagnostics: buildIntegrationDiagnostics(health.items),
  };
}
