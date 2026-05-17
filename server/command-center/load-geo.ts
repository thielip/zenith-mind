import type { GeoPayload } from "@/types/command-center/module-payloads";

export type { GeoPayload };
import type { KpiMetric } from "@/types/command-center/metrics";

/** GEO 能見度：目前為 Demo 示範資料（待接 Otterly / Semrush AI Visibility 等 API） */
export async function loadGeoPayload(): Promise<GeoPayload> {
  const engines = [
    { name: "ChatGPT Search", visibility: 68, shareOfVoice: 22, citations: 14, rank: 2 },
    { name: "Gemini", visibility: 74, shareOfVoice: 28, citations: 19, rank: 1 },
    { name: "Claude", visibility: 61, shareOfVoice: 18, citations: 11, rank: 3 },
    { name: "Perplexity", visibility: 55, shareOfVoice: 15, citations: 9, rank: 4 },
    { name: "Google AI Overview", visibility: 71, shareOfVoice: 25, citations: 16, rank: 2 },
  ];

  const kpis: KpiMetric[] = [
    {
      id: "geo-index",
      label: "GEO 能見度指數（Demo）",
      value: 72,
      unit: "/100",
      trend: "up",
      sparkline: [65, 68, 70, 72],
      changePct: 5,
      status: "warn",
      aiNote: "示範數據，非即時 API",
    },
    {
      id: "sov",
      label: "Share of Voice（Demo）",
      value: 26,
      unit: "%",
      trend: "up",
      sparkline: [22, 24, 25, 26],
      status: "warn",
    },
  ];

  return {
    isDemo: true,
    engines,
    kpis,
  };
}
