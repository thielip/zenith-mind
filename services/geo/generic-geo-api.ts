import { geoApiResponseSchema, type GeoThirdPartyResult } from "@/services/geo/types";

function getGeoApiConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl =
    process.env["GEO_API_BASE_URL"]?.trim() ||
    process.env["NEXT_PUBLIC_GEO_API_BASE_URL"]?.trim();
  const apiKey = process.env["GEO_API_KEY"]?.trim();
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

/** 對接自訂 GEO 後端（Otterly 等未公開 API 時可自建 proxy 指向此 URL） */
export async function fetchGenericGeoApi(domain: string): Promise<GeoThirdPartyResult | null> {
  const config = getGeoApiConfig();
  if (!config) return null;

  const url = new URL(`${config.baseUrl}/geo`);
  url.searchParams.set("domain", domain);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return {
        ok: false,
        source: "generic",
        message: `GEO API HTTP ${res.status}`,
      };
    }

    const json: unknown = await res.json();
    const parsed = geoApiResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        source: "generic",
        message: "GEO API 回應格式不符",
      };
    }

    return { ok: true, source: "generic", data: parsed.data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "GEO API 連線失敗";
    return { ok: false, source: "generic", message };
  }
}

export function hasGenericGeoApi(): boolean {
  return getGeoApiConfig() !== null;
}
