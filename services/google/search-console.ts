import { google } from "googleapis";
import { createGoogleAuth } from "./auth";

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

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

export async function fetchSearchConsoleSummary(): Promise<{
  ok: boolean;
  message?: string;
  queries: GscQueryRow[];
  landingPages: GscLandingRow[];
  totals: { clicks: number; impressions: number; ctr: number };
}> {
  const siteUrl = process.env["GOOGLE_SEARCH_CONSOLE_SITE_URL"]?.trim();
  if (!siteUrl) {
    return {
      ok: false,
      message: "未設定 GOOGLE_SEARCH_CONSOLE_SITE_URL",
      queries: [],
      landingPages: [],
      totals: { clicks: 0, impressions: 0, ctr: 0 },
    };
  }

  const auth = createGoogleAuth(SCOPES);
  if (!auth) {
    return {
      ok: false,
      message: "GA4 服務帳號未設定",
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

    const [queryRes, pageRes] = await Promise.all([
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
    ]);

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
    const message = e instanceof Error ? e.message : "Search Console API 失敗";
    return {
      ok: false,
      message,
      queries: [],
      landingPages: [],
      totals: { clicks: 0, impressions: 0, ctr: 0 },
    };
  }
}
