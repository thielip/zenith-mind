import { getPublishedPostFaqStats } from "@/lib/aeo/post-faq-stats";

/** 全站已部署的 Schema.org 類型（layout + 文章頁） */
export const SITE_SCHEMA_TYPES = [
  "Organization",
  "WebSite",
  "Article",
  "FAQPage",
  "BreadcrumbList",
] as const;

export interface SchemaCoverageStats {
  siteOrgWebSite: boolean;
  schemaTypesDeployed: string[];
  publishedTotal: number;
  withFaqCount: number;
  faqCoveragePct: number;
  withSeoMetadataCount: number;
  seoMetadataCoveragePct: number;
  /** FAQ + SEO Meta 與全站基礎 JSON-LD 綜合準備度 0–100 */
  readinessPct: number;
}

export async function getSchemaCoverageStats(): Promise<SchemaCoverageStats> {
  const postStats = await getPublishedPostFaqStats();
  const contentScore = Math.round(
    postStats.faqCoveragePct * 0.5 + postStats.seoMetadataCoveragePct * 0.5
  );
  const readinessPct = Math.min(100, Math.round(35 + contentScore * 0.65));

  return {
    siteOrgWebSite: true,
    schemaTypesDeployed: [...SITE_SCHEMA_TYPES],
    ...postStats,
    readinessPct,
  };
}
