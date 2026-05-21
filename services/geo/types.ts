import { z } from "zod";

/** 自訂 GEO REST API 回應（GET {GEO_API_BASE_URL}/geo?domain=...） */
export const geoApiResponseSchema = z.object({
  citedPages: z.number().optional(),
  brandMentions: z.number().optional(),
  aiEngineSov: z
    .array(z.object({ name: z.string(), sov: z.number() }))
    .optional(),
  citationQueries: z
    .array(
      z.object({
        query: z.string(),
        engines: z.array(z.string()),
        status: z.enum(["core", "extended", "none"]),
      })
    )
    .optional(),
  engines: z
    .array(
      z.object({
        name: z.string(),
        visibility: z.number(),
        shareOfVoice: z.number(),
        citations: z.number(),
        rank: z.number(),
      })
    )
    .optional(),
  note: z.string().optional(),
});

export type GeoApiResponse = z.infer<typeof geoApiResponseSchema>;

export type GeoThirdPartyResult =
  | { ok: true; source: "generic" | "semrush"; data: GeoApiResponse }
  | { ok: false; source: "generic" | "semrush"; message: string };
