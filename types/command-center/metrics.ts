import { z } from "zod";

export const timeGranularitySchema = z.enum([
  "today",
  "yesterday",
  "7d",
  "30d",
  "mom",
  "yoy",
]);

export type TimeGranularity = z.infer<typeof timeGranularitySchema>;

export const metricTrendSchema = z.enum(["up", "down", "flat"]);

export const kpiMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  changePct: z.number().optional(),
  trend: metricTrendSchema,
  sparkline: z.array(z.number()),
  granularity: z.record(timeGranularitySchema, z.number()).optional(),
  aiNote: z.string().optional(),
  status: z.enum(["ok", "warn", "critical"]).default("ok"),
});

export type KpiMetric = z.infer<typeof kpiMetricSchema>;

export const statusPillSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  status: z.enum(["ok", "warn", "error", "idle", "running"]),
});

export type StatusPill = z.infer<typeof statusPillSchema>;
