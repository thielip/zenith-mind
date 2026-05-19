import { fetchGa4DashboardBundle } from "@/infrastructure/ga4/dashboard-bundle";
import { getPublishedPostFaqStats } from "@/lib/aeo/post-faq-stats";
import { getCachedGa4Bundle } from "@/server/command-center/cached-data";
import { applyConnectedIntegrations } from "@/services/integrations/runtime-env";
import { fetchSearchConsoleSummary } from "@/services/google/search-console";
import type { GeoPayload } from "@/types/command-center/module-payloads";

export type { GeoPayload };
import type { KpiMetric } from "@/types/command-center/metrics";

function hasThirdPartyGeoApi(): boolean {
  return Boolean(
    process.env["OTTERLY_API_KEY"]?.trim() || process.env["SEMRUSH_API_KEY"]?.trim()
  );
}

async function loadGa4BundleForGeo() {
  try {
    return await getCachedGa4Bundle();
  } catch {
    await applyConnectedIntegrations(["ga4"]);
    return fetchGa4DashboardBundle();
  }
}

/** GEO：第三方 API 未設定時，以 GSC + GA4 + 站內結構化指標呈現真實數據（非靜態 Demo） */
export async function loadGeoPayload(): Promise<GeoPayload> {
  if (hasThirdPartyGeoApi()) {
    // 預留：接上 Otterly / Semrush 後改為 isDemo: false, dataSource: third_party
  }

  const [gsc, ga4, stats] = await Promise.all([
    fetchSearchConsoleSummary(),
    loadGa4BundleForGeo(),
    getPublishedPostFaqStats(),
  ]);

  const siteReadiness = Math.min(
    100,
    Math.round(
      stats.faqCoveragePct * 0.35 +
        stats.seoMetadataCoveragePct * 0.35 +
        (gsc.ok && gsc.totals.impressions > 0 ? 30 : 0)
    )
  );

  const gscVisibility = gsc.ok
    ? Math.min(100, Math.round(Math.log10(Math.max(10, gsc.totals.impressions)) * 25))
    : 0;

  const engines: GeoPayload["engines"] = [
    {
      name: "Google 搜尋（GSC 28D）",
      visibility: gscVisibility,
      shareOfVoice: Math.round(gsc.totals.ctr * 1000) / 10,
      citations: gsc.totals.clicks,
      rank: 1,
    },
    {
      name: "站內結構化（FAQ + SEO Meta）",
      visibility: Math.round((stats.faqCoveragePct + stats.seoMetadataCoveragePct) / 2),
      shareOfVoice: stats.faqCoveragePct,
      citations: stats.withFaqCount,
      rank: 2,
    },
  ];

  if (ga4.stats && ga4.reportingProbe.ok) {
    engines.push({
      name: "GA4 全站工作階段（7D 參考）",
      visibility: Math.min(100, Math.round((ga4.stats.sessions / 100) * 10)),
      shareOfVoice: ga4.stats.activeUsers,
      citations: ga4.stats.screenPageViews,
      rank: 3,
    });
  }

  const kpis: KpiMetric[] = [
    {
      id: "geo-readiness",
      label: "GEO 內容準備度",
      value: siteReadiness,
      unit: "/100",
      trend: siteReadiness >= 50 ? "up" : "flat",
      sparkline: [siteReadiness],
      status: siteReadiness >= 70 ? "ok" : siteReadiness >= 40 ? "warn" : "critical",
      aiNote: "FAQ + SEO Meta + GSC 曝光綜合（站內真實）",
    },
    {
      id: "gsc-impressions",
      label: "GSC 曝光 (28D)",
      value: gsc.totals.impressions,
      trend: gsc.ok ? "up" : "flat",
      sparkline: [gsc.totals.impressions],
      status: gsc.ok ? "ok" : "warn",
      aiNote: gsc.message,
    },
  ];

  return {
    isDemo: false,
    dataSource: "derived",
    note:
      "各 AI 引擎（ChatGPT / Perplexity 等）能見度需 Otterly 或 Semrush API。目前顯示 Search Console、GA4 與站內結構化之真實指標。",
    engines,
    kpis,
  };
}
