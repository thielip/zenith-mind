import { z } from "zod";
import { aiInsightSchema } from "./insights";
import { kpiMetricSchema, statusPillSchema } from "./metrics";
import { realtimeEventSchema, realtimeSnapshotSchema } from "./realtime";

export const warRoomPayloadSchema = z.object({
  statusPills: z.array(statusPillSchema),
  kpis: z.array(kpiMetricSchema),
  insights: z.array(aiInsightSchema),
  trafficSeries: z.array(
    z.object({ date: z.string(), sessions: z.number(), pageViews: z.number() })
  ),
  integrationSummary: z.object({
    ok: z.number(),
    missing: z.number(),
    error: z.number(),
  }),
});

export type WarRoomPayload = z.infer<typeof warRoomPayloadSchema>;

export const seoPayloadSchema = z.object({
  kpis: z.array(kpiMetricSchema),
  keywords: z.array(
    z.object({
      query: z.string(),
      clicks: z.number(),
      impressions: z.number(),
      ctr: z.number(),
      position: z.number(),
    })
  ),
  landingPages: z.array(
    z.object({ path: z.string(), clicks: z.number(), impressions: z.number() })
  ),
  cwv: z.object({
    lcp: z.number(),
    inp: z.number(),
    cls: z.number(),
  }),
  indexCoverage: z.number(),
  errorHealth: z.object({ notFound: z.number(), serverError: z.number() }),
});

export type SeoPayload = z.infer<typeof seoPayloadSchema>;

export const geoPayloadSchema = z.object({
  isDemo: z.boolean(),
  dataSource: z.enum(["third_party", "derived", "unavailable"]).optional(),
  note: z.string().optional(),
  engines: z.array(
    z.object({
      name: z.string(),
      visibility: z.number(),
      shareOfVoice: z.number(),
      citations: z.number(),
      rank: z.number(),
    })
  ),
  kpis: z.array(kpiMetricSchema),
});

export type GeoPayload = z.infer<typeof geoPayloadSchema>;

export const agentPayloadSchema = z.object({
  kpis: z.array(kpiMetricSchema),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      status: z.enum(["idle", "running", "error", "done"]),
      successRate: z.number(),
    })
  ),
  edges: z.array(z.object({ from: z.string(), to: z.string(), active: z.boolean() })),
  queue: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      status: z.string(),
      createdAt: z.string(),
    })
  ),
});

export type AgentPayload = z.infer<typeof agentPayloadSchema>;

export const realtimePagePayloadSchema = z.object({
  kpis: z.array(kpiMetricSchema),
  snapshot: realtimeSnapshotSchema,
  events: z.array(realtimeEventSchema),
  hotPages: z.array(z.object({ path: z.string(), views: z.number() })),
  sources: z.array(z.object({ source: z.string(), sessions: z.number() })),
});

export type RealtimePagePayload = z.infer<typeof realtimePagePayloadSchema>;
