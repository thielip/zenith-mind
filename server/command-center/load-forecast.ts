import { getCachedGa4Bundle } from "@/server/command-center/cached-data";
import { z } from "zod";

export const forecastPayloadSchema = z.object({
  ga4Ok: z.boolean(),
  ga4Message: z.string().optional(),
  history: z.array(
    z.object({
      date: z.string(),
      sessions: z.number(),
      pageViews: z.number(),
    })
  ),
});

export type ForecastPayload = z.infer<typeof forecastPayloadSchema>;

export async function loadForecastPayload(): Promise<ForecastPayload> {
  const ga4 = await getCachedGa4Bundle();

  const history = ga4.traffic
    .slice(-14)
    .map((d) => ({
      date: d.date,
      sessions: d.sessions,
      pageViews: d.pageViews,
    }));

  return {
    ga4Ok: ga4.reportingProbe.ok,
    ga4Message: ga4.reportingProbe.message,
    history,
  };
}
