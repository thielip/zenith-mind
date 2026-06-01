import { google } from "googleapis";
import { withRetry } from "@/lib/http/with-retry";
import { createSearchConsoleAuth, getSearchConsoleAuthMode } from "./auth";
import { normalizeGscSiteUrl } from "@/lib/google/gsc-site-url";
import { probeSearchConsoleRest } from "./search-console-probe";

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscLandingRow {
  path: string;
  clicks: number;
  impressions: number;
}

export interface GscSearchAppearanceRow {
  appearance: string;
  clicks: number;
  impressions: number;
  ctr: number;
}

export interface GscAeoAppearanceTotals {
  ok: boolean;
  message?: string;
  appearances: GscSearchAppearanceRow[];
  featuredSnippetPages: number;
  richResultImpressions: number;
  richResultClicks: number;
}

function formatGscProbeError(e: unknown, siteUrl: string): string {
  let message = e instanceof Error ? e.message : "Search Console API 失敗";
  if (/invalid_client/i.test(message)) {
    message =
      "invalid_client：OAuth Client Secret 與 Client ID 不符（常見於重設 Secret 後 GSC_OAUTH_CLIENT_SECRET 未更新）。請與 GOOGLE_ADS_CLIENT_SECRET 同步或執行 npm run gsc:sync-cf";
  }
  if (/sufficient permission/i.test(message)) {
    const mode = getSearchConsoleAuthMode();
    if (mode === "service_account") {
      message = `${message} — 目前用服務帳號 ${process.env["GA4_CLIENT_EMAIL"] ?? ""}，但 GSC 無法加入該 Email 時，請在 .env.local 設定 GSC_OAUTH_CLIENT_ID / GSC_OAUTH_CLIENT_SECRET / GSC_OAUTH_REFRESH_TOKEN`;
    } else if (mode === "oauth") {
      message = `${message} — OAuth 用的 Google 帳號須在 GSC 對「${siteUrl}」具備完整權限；並確認 GOOGLE_SEARCH_CONSOLE_SITE_URL 與 GSC 資源字串完全一致`;
    }
  }
  return message;
}

/** 輕量連線探測：REST + AbortSignal（避免 googleapis 在 serverless 無逾時卡住） */
export async function probeSearchConsoleApi(): Promise<{
  ok: boolean;
  message?: string;
}> {
  const siteUrl = normalizeGscSiteUrl(process.env["GOOGLE_SEARCH_CONSOLE_SITE_URL"]);
  const result = await probeSearchConsoleRest();
  if (!result.ok && siteUrl && result.message) {
    return { ok: false, message: formatGscProbeError(new Error(result.message), siteUrl) };
  }
  return result;
}

export async function fetchSearchConsoleSummary(options?: {
  signal?: AbortSignal;
}): Promise<{
  ok: boolean;
  message?: string;
  queries: GscQueryRow[];
  landingPages: GscLandingRow[];
  totals: { clicks: number; impressions: number; ctr: number };
}> {
  const siteUrl = normalizeGscSiteUrl(process.env["GOOGLE_SEARCH_CONSOLE_SITE_URL"]);
  if (!siteUrl) {
    return {
      ok: false,
      message: "未設定 GOOGLE_SEARCH_CONSOLE_SITE_URL（例：https://www.getzenithmind.com/）",
      queries: [],
      landingPages: [],
      totals: { clicks: 0, impressions: 0, ctr: 0 },
    };
  }

  const auth = createSearchConsoleAuth();
  if (!auth) {
    return {
      ok: false,
      message:
        "未設定 GSC 認證：請設 GSC_OAUTH_*（建議）或 GA4_CLIENT_EMAIL + GA4_PRIVATE_KEY",
      queries: [],
      landingPages: [],
      totals: { clicks: 0, impressions: 0, ctr: 0 },
    };
  }

  try {
    const searchconsole = google.searchconsole({ version: "v1", auth });
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28);

    const [queryRes, pageRes] = await withRetry(
      () =>
      Promise.all([
        searchconsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
            dimensions: ["query"],
            rowLimit: 12,
          },
        }),
        searchconsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
            dimensions: ["page"],
            rowLimit: 10,
          },
        }),
      ]),
      { signal: options?.signal }
    );

    const queries: GscQueryRow[] = (queryRes.data.rows ?? []).map((row) => ({
      query: row.keys?.[0] ?? "(not set)",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }));

    const landingPages: GscLandingRow[] = (pageRes.data.rows ?? []).map((row) => ({
      path: row.keys?.[0] ?? "/",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
    }));

    const clicks = queries.reduce((s, r) => s + r.clicks, 0);
    const impressions = queries.reduce((s, r) => s + r.impressions, 0);

    return {
      ok: true,
      queries,
      landingPages,
      totals: {
        clicks,
        impressions,
        ctr: impressions > 0 ? clicks / impressions : 0,
      },
    };
  } catch (e) {
    return {
      ok: false,
      message: formatGscProbeError(e, siteUrl),
      queries: [],
      landingPages: [],
      totals: { clicks: 0, impressions: 0, ctr: 0 },
    };
  }
}

function gscDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

/** GSC searchAppearance：Featured Snippets / Rich Results 等（AEO 用） */
export async function fetchGscAeoAppearanceTotals(): Promise<GscAeoAppearanceTotals> {
  const siteUrl = normalizeGscSiteUrl(process.env["GOOGLE_SEARCH_CONSOLE_SITE_URL"]);
  if (!siteUrl) {
    return {
      ok: false,
      message: "未設定 GOOGLE_SEARCH_CONSOLE_SITE_URL",
      appearances: [],
      featuredSnippetPages: 0,
      richResultImpressions: 0,
      richResultClicks: 0,
    };
  }

  const auth = createSearchConsoleAuth();
  if (!auth) {
    return {
      ok: false,
      message: "未設定 GSC 認證（GSC_OAUTH_* 或服務帳號）",
      appearances: [],
      featuredSnippetPages: 0,
      richResultImpressions: 0,
      richResultClicks: 0,
    };
  }

  try {
    const searchconsole = google.searchconsole({ version: "v1", auth });
    const { startDate, endDate } = gscDateRange(28);

    const res = await withRetry(() =>
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ["searchAppearance"],
          rowLimit: 50,
        },
      })
    );

    const appearances: GscSearchAppearanceRow[] = (res.data.rows ?? []).map((row) => ({
      appearance: row.keys?.[0] ?? "(not set)",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
    }));

    const featuredRows = appearances.filter((r) =>
      /featured|snippet/i.test(r.appearance)
    );
    const richRows = appearances.filter((r) =>
      /rich|faq|howto|recipe|review|structured/i.test(r.appearance)
    );

    const featuredSnippetPages = featuredRows.reduce((s, r) => s + r.impressions, 0);
    const richResultImpressions = richRows.reduce((s, r) => s + r.impressions, 0);
    const richResultClicks = richRows.reduce((s, r) => s + r.clicks, 0);

    return {
      ok: true,
      appearances,
      featuredSnippetPages,
      richResultImpressions,
      richResultClicks,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "GSC searchAppearance 查詢失敗";
    return {
      ok: false,
      message,
      appearances: [],
      featuredSnippetPages: 0,
      richResultImpressions: 0,
      richResultClicks: 0,
    };
  }
}
