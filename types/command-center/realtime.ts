import { z } from "zod";

export const realtimeEventSchema = z.object({
  id: z.string(),
  ts: z.string(),
  level: z.enum(["info", "warn", "error", "success"]),
  channel: z.enum(["agent", "http", "system", "traffic", "seo", "ads"]),
  message: z.string(),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

export const realtimeSnapshotSchema = z.object({
  liveUsers: z.number(),
  queueDepth: z.number(),
  cacheHitRate: z.number(),
  apiLatencyMs: z.number(),
  errorRate: z.number(),
  webhookOk: z.boolean(),
});

export type RealtimeSnapshot = z.infer<typeof realtimeSnapshotSchema>;
