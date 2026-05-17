export interface GoogleAdsSummary {
  ok: boolean;
  message: string;
  spendToday: number;
  clicks: number;
  impressions: number;
  roas: number;
}

/** OAuth 探測 + 佔位指標（完整 Ads API 需 google-ads-api 套件與 developer token） */
export async function fetchGoogleAdsSummary(): Promise<GoogleAdsSummary> {
  const required = [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
  ];
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length > 0) {
    return {
      ok: false,
      message: `缺少：${missing.join(", ")}`,
      spendToday: 0,
      clicks: 0,
      impressions: 0,
      roas: 0,
    };
  }

  try {
    const body = new URLSearchParams({
      client_id: process.env["GOOGLE_ADS_CLIENT_ID"]!,
      client_secret: process.env["GOOGLE_ADS_CLIENT_SECRET"]!,
      refresh_token: process.env["GOOGLE_ADS_REFRESH_TOKEN"]!,
      grant_type: "refresh_token",
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      return {
        ok: false,
        message: `OAuth 失敗 (${res.status})`,
        spendToday: 0,
        clicks: 0,
        impressions: 0,
        roas: 0,
      };
    }
    return {
      ok: true,
      message: "OAuth 正常（Ads 報表 API 待擴充）",
      spendToday: 0,
      clicks: 0,
      impressions: 0,
      roas: 0,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Ads 連線失敗",
      spendToday: 0,
      clicks: 0,
      impressions: 0,
      roas: 0,
    };
  }
}
