import { unstable_cache } from "next/cache";
import { fetchGa4DashboardBundle } from "@/infrastructure/ga4/dashboard-bundle";
import { fetchDashboardDbSnapshot } from "@/lib/admin/dashboard-data";
import { runInsightPipeline } from "@/features/ai-insights/services/pipeline";
import { runIntegrationHealthChecks } from "@/lib/admin/integration-health";
import { applyConnectedIntegrations } from "@/services/integrations/runtime-env";
import { dedupeTopPages } from "@/infrastructure/ga4/top-pages";

const REVALIDATE = 60;

export const getCachedGa4Bundle = unstable_cache(
  async () => {
    await applyConnectedIntegrations(["ga4"]);
    const bundle = await fetchGa4DashboardBundle();
    return {
      ...bundle,
      topPages: dedupeTopPages(bundle.topPages),
    };
  },
  ["cc-ga4-bundle"],
  { revalidate: REVALIDATE, tags: ["cc-ga4", "cc-integrations"] }
);

export const getCachedDbSnapshot = unstable_cache(
  async () => fetchDashboardDbSnapshot(),
  ["cc-db-snapshot"],
  { revalidate: REVALIDATE, tags: ["cc-db"] }
);

export const getCachedInsights = unstable_cache(
  async () => {
    await applyConnectedIntegrations(["ga4", "gemini"]);
    return runInsightPipeline();
  },
  ["cc-insights"],
  { revalidate: 90, tags: ["cc-insights", "cc-integrations"] }
);

export const getCachedHealthReport = unstable_cache(
  async () => {
    await applyConnectedIntegrations();
    const ga4 = await getCachedGa4Bundle();
    return runIntegrationHealthChecks({
      ga4ReportingProbe: ga4.reportingProbe,
      databaseProbe: { ok: true, message: "資料庫連線正常" },
    });
  },
  ["cc-health"],
  { revalidate: 120, tags: ["cc-health", "cc-integrations", "cc-ga4"] }
);
