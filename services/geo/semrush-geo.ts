import type { GeoApiResponse, GeoThirdPartyResult } from "@/services/geo/types";

const SEMRUSH_API = "https://api.semrush.com/";

function domainFromSiteUrl(siteUrl: string): string {
  try {
    const host = new URL(siteUrl).hostname.replace(/^www\./, "");
    return host || "getzenithmind.com";
  } catch {
    return "getzenithmind.com";
  }
}

/**
 * Semrush domain_ranks：有機能見度代理指標（非 AI 引擎即時 SoV）。
 * 文件：https://developer.semrush.com/api/v3/analytics/domain-reports/
 */
export async function fetchSemrushGeoProxy(
  siteUrl: string
): Promise<GeoThirdPartyResult | null> {
  const apiKey = process.env["SEMRUSH_API_KEY"]?.trim();
  if (!apiKey) return null;

  const domain =
    process.env["SEMRUSH_DOMAIN"]?.trim() || domainFromSiteUrl(siteUrl);
  const database = process.env["SEMRUSH_DATABASE"]?.trim() || "us";

  const url = new URL(SEMRUSH_API);
  url.searchParams.set("type", "domain_ranks");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("domain", domain);
  url.searchParams.set("database", database);
  url.searchParams.set("export_columns", "Dn,Rk,Or,Ot,Oc,Ad,At");

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(20_000),
      next: { revalidate: 3600 },
    });
    const text = await res.text();

    if (!res.ok || text.startsWith("ERROR")) {
      return {
        ok: false,
        source: "semrush",
        message: text.slice(0, 120) || `Semrush HTTP ${res.status}`,
      };
    }

    const lines = text.trim().split("\n").filter(Boolean);
    const dataLine = lines.length > 1 ? lines[1] : lines[0];
    if (!dataLine) {
      return { ok: false, source: "semrush", message: "Semrush 無資料列" };
    }

    const cols = dataLine.split(";");
    const organicTraffic = Number(cols[3]) || 0;
    const organicCost = Number(cols[4]) || 0;
    const rank = Number(cols[1]) || 0;

    const visibility = Math.min(
      100,
      Math.round(Math.log10(Math.max(10, organicTraffic)) * 18)
    );
    const sovProxy = Math.min(100, Math.round(organicCost / 1000));

    const payload: GeoApiResponse = {
      citedPages: organicTraffic,
      brandMentions: sovProxy,
      aiEngineSov: [
        { name: "ChatGPT", sov: Math.min(95, visibility + 5) },
        { name: "Gemini", sov: Math.min(90, visibility) },
        { name: "Claude", sov: Math.min(88, visibility - 3) },
        { name: "Perplexity", sov: Math.min(92, visibility + 2) },
        { name: "Google AIO", sov: Math.min(100, visibility + 8) },
      ],
      engines: [
        {
          name: `Semrush 有機流量（${database}）`,
          visibility,
          shareOfVoice: sovProxy,
          citations: organicTraffic,
          rank: rank || 1,
        },
      ],
      note: `Semrush domain_ranks 代理指標（${domain}）。AI 引擎 SoV 為有機流量推算，非 Otterly 即時引用。`,
    };

    return { ok: true, source: "semrush", data: payload };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Semrush API 連線失敗";
    return { ok: false, source: "semrush", message };
  }
}

export function hasSemrushGeoApi(): boolean {
  return Boolean(process.env["SEMRUSH_API_KEY"]?.trim());
}
