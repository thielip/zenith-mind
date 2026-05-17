import { fetchGa4DashboardBundle } from "@/infrastructure/ga4/dashboard-bundle";
import { fetchDashboardDbSnapshot } from "@/lib/admin/dashboard-data";
import { fetchSearchConsoleSummary } from "@/services/google/search-console";

export interface CollectedSignals {
  realtimeUsers: number;
  sessions7d: number;
  pageViews7d: number;
  publishedPosts: number;
  pendingAiJobs: number;
  gscClicks: number;
  gscImpressions: number;
  gscOk: boolean;
  ga4Ok: boolean;
}

export async function collectInsightSignals(): Promise<CollectedSignals> {
  const [ga4, db, gsc] = await Promise.all([
    fetchGa4DashboardBundle(),
    fetchDashboardDbSnapshot(),
    fetchSearchConsoleSummary(),
  ]);

  return {
    realtimeUsers: ga4.realtimeUsers,
    sessions7d: ga4.stats?.sessions ?? 0,
    pageViews7d: ga4.stats?.screenPageViews ?? 0,
    publishedPosts: db.postPublished,
    pendingAiJobs: db.aiPending,
    gscClicks: gsc.totals.clicks,
    gscImpressions: gsc.totals.impressions,
    gscOk: gsc.ok,
    ga4Ok: ga4.reportingProbe.ok,
  };
}
