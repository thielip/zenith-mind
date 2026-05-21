import { fetchGenericGeoApi, hasGenericGeoApi } from "@/services/geo/generic-geo-api";
import { fetchSemrushGeoProxy, hasSemrushGeoApi } from "@/services/geo/semrush-geo";
import type { GeoApiResponse, GeoThirdPartyResult } from "@/services/geo/types";

export type { GeoApiResponse, GeoThirdPartyResult };

export function hasThirdPartyGeoConfig(): boolean {
  return (
    hasGenericGeoApi() ||
    hasSemrushGeoApi() ||
    Boolean(process.env["OTTERLY_API_KEY"]?.trim())
  );
}

/** 優先：自訂 GEO API → Semrush；Otterly 尚無公開 REST，可設 GEO_API_BASE_URL 指向自建 proxy */
export async function fetchThirdPartyGeo(
  siteUrl: string
): Promise<GeoThirdPartyResult | null> {
  const domain = (() => {
    try {
      return new URL(siteUrl).hostname.replace(/^www\./, "");
    } catch {
      return "getzenithmind.com";
    }
  })();

  if (hasGenericGeoApi()) {
    const generic = await fetchGenericGeoApi(domain);
    if (generic) return generic;
  }

  if (hasSemrushGeoApi()) {
    return fetchSemrushGeoProxy(siteUrl);
  }

  if (process.env["OTTERLY_API_KEY"]?.trim()) {
    return {
      ok: false,
      source: "generic",
      message:
        "已設定 OTTERLY_API_KEY，但 Otterly 尚無公開 API。請改設 GEO_API_BASE_URL + GEO_API_KEY 指向自建 proxy。",
    };
  }

  return null;
}
