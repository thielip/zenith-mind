import { getCachedDbSnapshot, getCachedGa4Bundle } from "@/server/command-center/cached-data";
import { kpiMetricSchema, type KpiMetric } from "@/types/command-center/metrics";
import { z } from "zod";

export const contentPayloadSchema = z.object({
  kpis: z.array(kpiMetricSchema),
  pages: z.array(
    z.object({ path: z.string(), title: z.string(), views: z.number() })
  ),
});

export type ContentPayload = z.infer<typeof contentPayloadSchema>;

export async function loadContentPayload(): Promise<ContentPayload> {
  const [db, ga4] = await Promise.all([getCachedDbSnapshot(), getCachedGa4Bundle()]);

  const kpis: KpiMetric[] = [
    {
      id: "published",
      label: "已發布",
      value: db.postPublished,
      trend: "flat",
      sparkline: [db.postPublished],
      status: "ok",
    },
    {
      id: "draft",
      label: "草稿",
      value: db.postDraft,
      trend: "flat",
      sparkline: [db.postDraft],
      status: "ok",
    },
  ];

  return {
    kpis,
    pages: ga4.topPages.map((p) => ({
      path: p.path,
      title: p.title,
      views: p.views,
    })),
  };
}
