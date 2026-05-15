// infrastructure/ga4/reporting.client.ts — Node Runtime
// GA4 Reporting API（fetch revalidate:3600，封裝在 infrastructure/ 層）
// ⚠ 獨立 fetch 層 Cache，與頁面 Segment Config 完全隔離，無衝突
// ⚠ GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY 絕不可 NEXT_PUBLIC_

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { env } from "@/env";

let _client: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient {
  _client ??= new BetaAnalyticsDataClient({
    credentials: {
      client_email: env.GA4_CLIENT_EMAIL,
      // Vercel 環境變數中 \n 需還原
      private_key:  env.GA4_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
  });
  return _client;
}

// ── 型別 ──────────────────────────────────────────────────

export interface TrafficDataPoint {
  date:      string; // YYYYMMDD
  sessions:  number;
  pageViews: number;
  users:     number;
}

/** 過去 7 天（7daysAgo〜today）加總摘要 */
export interface BasicStatsLast7Days {
  sessions:        number;
  screenPageViews: number;
  activeUsers:     number;
}

export interface TopPageMetric {
  path: string;
  title: string;
  views: number;
  users: number;
}

// ── 過去 7 天摘要 ─────────────────────────────────────────

export async function fetchBasicStatsLast7Days(): Promise<BasicStatsLast7Days> {
  const [response] = await getClient().runReport({
    property:   `properties/${env.GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics:    [
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "activeUsers" },
    ],
  });

  const row = response.rows?.[0];
  return {
    sessions:        parseInt(row?.metricValues?.[0]?.value ?? "0", 10),
    screenPageViews: parseInt(row?.metricValues?.[1]?.value ?? "0", 10),
    activeUsers:     parseInt(row?.metricValues?.[2]?.value ?? "0", 10),
  };
}

// ── 流量趨勢（Recharts 用）────────────────────────────────

export async function fetchTrafficTrend(p: {
  startDate: string;
  endDate:   string;
}): Promise<TrafficDataPoint[]> {
  const [response] = await getClient().runReport({
    property:   `properties/${env.GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: p.startDate, endDate: p.endDate }],
    dimensions: [{ name: "date" }],
    metrics:    [
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "totalUsers" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  return (response.rows ?? []).map((row) => ({
    date:      row.dimensionValues?.[0]?.value ?? "",
    sessions:  parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    pageViews: parseInt(row.metricValues?.[1]?.value ?? "0", 10),
    users:     parseInt(row.metricValues?.[2]?.value ?? "0", 10),
  }));
}

export async function fetchRealtimeActiveUsers(): Promise<number> {
  const [response] = await getClient().runRealtimeReport({
    property: `properties/${env.GA4_PROPERTY_ID}`,
    metrics: [{ name: "activeUsers" }],
  });

  return parseInt(response.rows?.[0]?.metricValues?.[0]?.value ?? "0", 10);
}

export async function fetchTopPagesLast7Days(limit = 8): Promise<TopPageMetric[]> {
  const [response] = await getClient().runReport({
    property: `properties/${env.GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });

  return (response.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    title: row.dimensionValues?.[1]?.value ?? "(not set)",
    views: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    users: parseInt(row.metricValues?.[1]?.value ?? "0", 10),
  }));
}
