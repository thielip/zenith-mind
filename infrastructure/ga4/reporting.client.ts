// infrastructure/ga4/reporting.client.ts — Node Runtime
// GA4 Reporting API（fetch revalidate:3600，封裝在 infrastructure/ 層）
// ⚠ 獨立 fetch 層 Cache，與頁面 Segment Config 完全隔離，無衝突
// ⚠ GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY 絕不可 NEXT_PUBLIC_

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { env } from "@/env";
import { withRetry } from "@/lib/http/with-retry";
import { normalizeServiceAccountPrivateKey } from "@/lib/google/normalize-private-key";

let _client: BetaAnalyticsDataClient | null = null;
let _clientFingerprint: string | null = null;

/** Next dev 可能快取舊 env 物件；以 process.env 為準（與 checkGa4Env / CLI 一致） */
function ga4RuntimeEnv() {
  const clientEmail =
    process.env["GA4_CLIENT_EMAIL"]?.trim() || env.GA4_CLIENT_EMAIL;
  const privateKeyRaw =
    process.env["GA4_PRIVATE_KEY"]?.trim() || env.GA4_PRIVATE_KEY;
  const propertyId =
    process.env["GA4_PROPERTY_ID"]?.trim() || env.GA4_PROPERTY_ID;
  return {
    clientEmail,
    privateKey: normalizeServiceAccountPrivateKey(privateKeyRaw),
    propertyId,
  };
}

function buildCredentials() {
  const { clientEmail, privateKey } = ga4RuntimeEnv();
  return {
    client_email: clientEmail,
    private_key: privateKey,
  };
}

function credentialsFingerprint() {
  const creds = buildCredentials();
  const { propertyId } = ga4RuntimeEnv();
  return `${creds.client_email}|${propertyId}|${creds.private_key.length}|${creds.private_key.slice(-24)}`;
}

export function ga4PropertyResourceName() {
  return `properties/${ga4RuntimeEnv().propertyId}`;
}

function getClient(): BetaAnalyticsDataClient {
  const fp = credentialsFingerprint();
  // dev / HMR 時避免沿用舊憑證 singleton（常導致 CLI 成功但儀表板失敗）
  if (
    !_client ||
    process.env.NODE_ENV === "development" ||
    _clientFingerprint !== fp
  ) {
    _client = new BetaAnalyticsDataClient({ credentials: buildCredentials() });
    _clientFingerprint = fp;
  }
  return _client;
}

/** 測試或更新 .env 後可手動清除（一般重啟 dev server 即可） */
export function resetGa4ReportingClient() {
  _client = null;
  _clientFingerprint = null;
}

// ── 型別 ──────────────────────────────────────────────────

export interface TrafficDataPoint {
  date: string;
  sessions: number;
  pageViews: number;
  users: number;
}

export interface BasicStatsLast7Days {
  sessions: number;
  screenPageViews: number;
  activeUsers: number;
}

export interface TopPageMetric {
  path: string;
  title: string;
  views: number;
  users: number;
}

export async function fetchBasicStatsLast7Days(): Promise<BasicStatsLast7Days> {
  const [response] = await withRetry(() =>
    getClient().runReport({
      property: ga4PropertyResourceName(),
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "activeUsers" },
      ],
    })
  );

  const row = response.rows?.[0];
  return {
    sessions: parseInt(row?.metricValues?.[0]?.value ?? "0", 10),
    screenPageViews: parseInt(row?.metricValues?.[1]?.value ?? "0", 10),
    activeUsers: parseInt(row?.metricValues?.[2]?.value ?? "0", 10),
  };
}

export async function fetchTrafficTrend(p: {
  startDate: string;
  endDate: string;
}): Promise<TrafficDataPoint[]> {
  const [response] = await withRetry(() =>
    getClient().runReport({
      property: ga4PropertyResourceName(),
      dateRanges: [{ startDate: p.startDate, endDate: p.endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "totalUsers" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    })
  );

  return (response.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    sessions: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    pageViews: parseInt(row.metricValues?.[1]?.value ?? "0", 10),
    users: parseInt(row.metricValues?.[2]?.value ?? "0", 10),
  }));
}

export async function fetchRealtimeActiveUsers(): Promise<number> {
  const [response] = await withRetry(() =>
    getClient().runRealtimeReport({
      property: ga4PropertyResourceName(),
      metrics: [{ name: "activeUsers" }],
    })
  );

  return parseInt(response.rows?.[0]?.metricValues?.[0]?.value ?? "0", 10);
}

export async function fetchTopPagesLast7Days(limit = 8): Promise<TopPageMetric[]> {
  const [response] = await withRetry(() =>
    getClient().runReport({
      property: ga4PropertyResourceName(),
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit,
    })
  );

  return (response.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    title: row.dimensionValues?.[1]?.value ?? "(not set)",
    views: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    users: parseInt(row.metricValues?.[1]?.value ?? "0", 10),
  }));
}
