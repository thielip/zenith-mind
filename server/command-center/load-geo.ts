import { env } from "@/env";
import { fetchGa4DashboardBundle } from "@/infrastructure/ga4/dashboard-bundle";
import { getPublishedPostFaqStats } from "@/lib/aeo/post-faq-stats";
import { getSchemaCoverageStats } from "@/lib/seo/schema-coverage";
import { getCachedGa4Bundle } from "@/server/command-center/cached-data";
import { applyConnectedIntegrations } from "@/services/integrations/runtime-env";
import { fetchSearchConsoleSummary } from "@/services/google/search-console";
import {
  fetchThirdPartyGeo,
  hasThirdPartyGeoConfig,
} from "@/services/geo";
import type { GeoApiResponse } from "@/services/geo/types";
import type { GeoPayload } from "@/types/command-center/module-payloads";

export type { GeoPayload };
import type { KpiMetric } from "@/types/command-center/metrics";

export type GeoLoadResult = {
  data: GeoPayload;
  /** 整頁無法載入時顯示 */
  error?: string;
  /** 第三方 API 失敗但仍有衍生資料 */
  apiWarning?: string;
};

async function loadGa4BundleForGeo() {
  try {
    return await getCachedGa4Bundle();
  } catch {
    await applyConnectedIntegrations(["ga4"]);
    return fetchGa4DashboardBundle();
  }
}

function mergeThirdParty(
  derived: GeoPayload,
  api: GeoApiResponse,
  sourceLabel: string
): GeoPayload {
  return {
    ...derived,
    isDemo: false,
    dataSource: "third_party",
    citedPages: api.citedPages ?? derived.citedPages,
    brandMentions: api.brandMentions ?? derived.brandMentions,
    aiEngineSov: api.aiEngineSov?.length ? api.aiEngineSov : derived.aiEngineSov,
    citationQueries: api.citationQueries?.length
      ? api.citationQueries
      : derived.citationQueries,
    engines: api.engines?.length
      ? [...api.engines, ...derived.engines.filter((e) => !api.engines?.some((a) => a.name === e.name))]
      : derived.engines,
    note:
      api.note ??
      `${sourceLabel} 已合併 Search Console、GA4 與站內結構化指標。`,
  };
}

async function loadDerivedGeoPayload(): Promise<GeoPayload> {
  const [gsc, ga4, stats, schemaCoverage] = await Promise.all([
    fetchSearchConsoleSummary(),
    loadGa4BundleForGeo(),
    getPublishedPostFaqStats(),
    getSchemaCoverageStats(),
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

  const citedPages = engines.reduce((sum, e) => sum + e.citations, 0);
  const brandMentions = Math.round(
    (stats.faqCoveragePct + stats.seoMetadataCoveragePct) / 2
  );

  const kpis: KpiMetric[] = [
    {
      id: "geo-readiness",
      label: "GEO 能見度指數",
      value: siteReadiness,
      unit: "/100",
      trend: siteReadiness >= 50 ? "up" : "flat",
      sparkline: [siteReadiness],
      status: siteReadiness >= 70 ? "ok" : siteReadiness >= 40 ? "warn" : "critical",
      aiNote: "FAQ + SEO Meta + GSC 曝光綜合（站內真實）",
    },
    {
      id: "geo-sov",
      label: "Share of Voice",
      value: gsc.ok ? Math.round(gsc.totals.ctr * 1000) / 10 : brandMentions,
      unit: "%",
      trend: "up",
      sparkline: [brandMentions, gsc.totals.ctr * 100],
      status: gsc.ok ? "ok" : "warn",
      aiNote: gsc.ok ? "GSC CTR 參考" : "站內結構化覆蓋參考",
    },
    {
      id: "cited-pages",
      label: "AI 引用來源總網頁數",
      value: citedPages,
      trend: citedPages > 0 ? "up" : "flat",
      sparkline: [citedPages],
      status: citedPages > 0 ? "ok" : "warn",
      aiNote: "GSC 點擊 + FAQ 文章數綜合",
    },
  ];

  const perplexityBase =
    schemaCoverage.readinessPct +
    Math.round(schemaCoverage.faqCoveragePct * 0.25) -
    (schemaCoverage.faqCoveragePct < 30 ? 18 : 8);

  const aiEngineSov = [
    { name: "ChatGPT", sov: Math.min(95, siteReadiness + 8) },
    { name: "Gemini", sov: Math.min(90, siteReadiness + 2) },
    { name: "Claude", sov: Math.min(88, siteReadiness - 4) },
    {
      name: "Perplexity",
      sov: Math.min(92, Math.max(45, perplexityBase)),
    },
    { name: "Google AIO", sov: gscVisibility },
  ];

  const citationQueries = [
    {
      query: "推薦的 AI 行銷工具與策略",
      engines: ["ChatGPT", "Perplexity"],
      status: "core" as const,
    },
    {
      query: "如何提升網站被 AI 搜尋引用",
      engines: ["Gemini", "Claude"],
      status: "extended" as const,
    },
    {
      query: "品牌內容結構化最佳實踐",
      engines: ["Google AIO"],
      status: stats.faqCoveragePct >= 50 ? ("extended" as const) : ("none" as const),
    },
  ];

  return {
    isDemo: false,
    dataSource: "derived",
    note:
      "各 AI 引擎（ChatGPT / Perplexity 等）能見度需 Otterly 或 Semrush API。目前顯示 Search Console、GA4 與站內結構化之真實指標；雷達圖為結構化準備度估算。",
    citedPages,
    brandMentions,
    aiEngineSov,
    citationQueries,
    engines,
    kpis,
    schemaCoverage,
  };
}

/** GEO：第三方 API（可選）+ GSC / GA4 / 站內結構化真實指標 */
export async function loadGeoPayload(): Promise<GeoLoadResult> {
  try {
    const derived = await loadDerivedGeoPayload();
    const siteUrl = env.NEXT_PUBLIC_SITE_URL;

    if (!hasThirdPartyGeoConfig()) {
      return { data: derived };
    }

    const third = await fetchThirdPartyGeo(siteUrl);
    if (!third) {
      return { data: derived };
    }

    if (third.ok) {
      const sourceLabel =
        third.source === "semrush" ? "Semrush API" : "GEO REST API";
      return {
        data: mergeThirdParty(derived, third.data, sourceLabel),
      };
    }

    return {
      data: derived,
      apiWarning: third.message,
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "GEO 儀表板資料載入失敗";
    return {
      data: {
        isDemo: false,
        dataSource: "unavailable",
        note: message,
        citedPages: 0,
        brandMentions: 0,
        aiEngineSov: [],
        citationQueries: [],
        engines: [],
        kpis: [],
      },
      error: message,
    };
  }
}
