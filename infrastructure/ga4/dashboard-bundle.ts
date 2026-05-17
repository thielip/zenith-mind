import { formatApiError } from "@/lib/admin/format-api-error";
import {
  fetchBasicStatsLast7Days,
  fetchRealtimeActiveUsers,
  fetchTopPagesLast7Days,
  fetchTrafficTrend,
  type BasicStatsLast7Days,
  type TopPageMetric,
  type TrafficDataPoint,
} from "@/infrastructure/ga4/reporting.client";
import type { ProbeResult } from "@/infrastructure/health/probes";

export interface Ga4DashboardBundle {
  realtimeUsers: number;
  stats: BasicStatsLast7Days | null;
  traffic: TrafficDataPoint[];
  topPages: TopPageMetric[];
  reportingProbe: ProbeResult;
}

/** 儀表板用：序列化 GA4 請求，避免並發過多導致探測失敗 */
export async function fetchGa4DashboardBundle(): Promise<Ga4DashboardBundle> {
  let realtimeUsers = 0;
  let reportingProbe: ProbeResult;

  try {
    realtimeUsers = await fetchRealtimeActiveUsers();
    reportingProbe = {
      ok: true,
      message: `Reporting API 正常（即時使用者 ${realtimeUsers}）`,
    };
  } catch (error) {
    const detail = formatApiError(error);
    reportingProbe = {
      ok: false,
      message:
        detail === "未知錯誤"
          ? "GA4 API 連線失敗（請執行 npx tsx --env-file=.env.local scripts/test-dashboard-ga4.mjs 比對；若 CLI 成功請刪除 .next 後重啟 dev）"
          : detail,
    };
    if (process.env.NODE_ENV === "development") {
      console.error("[GA4 dashboard]", error);
    }
  }

  if (!reportingProbe.ok) {
    return {
      realtimeUsers: 0,
      stats: null,
      traffic: [],
      topPages: [],
      reportingProbe,
    };
  }

  const [stats, traffic, topPages] = await Promise.all([
    fetchBasicStatsLast7Days().catch(() => null),
    fetchTrafficTrend({ startDate: "30daysAgo", endDate: "today" }).catch(() => []),
    fetchTopPagesLast7Days().catch(() => []),
  ]);

  return {
    realtimeUsers,
    stats,
    traffic,
    topPages,
    reportingProbe,
  };
}
