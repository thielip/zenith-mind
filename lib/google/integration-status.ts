interface GoogleIntegrationStatus {
  name: string;
  status: "connected" | "missing";
  description: string;
  missing: string[];
}

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function status(name: string, description: string, requiredEnv: string[]): GoogleIntegrationStatus {
  const missing = requiredEnv.filter((key) => !hasEnv(key));
  return {
    name,
    description,
    missing,
    status: missing.length === 0 ? "connected" : "missing",
  };
}

/** 從 GA4 服務帳號 email 推斷 GCP 專案 ID（例：xxx@my-project.iam.gserviceaccount.com） */
export function deriveGcpProjectId(): string | undefined {
  const explicit = process.env["GOOGLE_CLOUD_PROJECT_ID"]?.trim();
  if (explicit) return explicit;

  const email = process.env["GA4_CLIENT_EMAIL"]?.trim();
  if (!email) return undefined;

  const match = email.match(/@([^.]+)\.iam\.gserviceaccount\.com$/i);
  return match?.[1];
}

export function getGoogleIntegrationStatuses(): GoogleIntegrationStatus[] {
  const adsRequired = [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
  ];
  const adsMissing = adsRequired.filter((key) => !hasEnv(key));
  const adsDescription =
    adsMissing.length === 0 && !hasEnv("GOOGLE_ADS_LOGIN_CUSTOMER_ID")
      ? "OAuth 變數已齊；若透過 MCC 操作，建議另設 GOOGLE_ADS_LOGIN_CUSTOMER_ID。"
      : "需 OAuth Client、Refresh Token、Developer Token；MCC 帳戶另需 LOGIN_CUSTOMER_ID。";

  return [
    status("GA4", "Reporting API：工作階段、瀏覽量、活躍使用者與熱門頁面。", [
      "GA4_CLIENT_EMAIL",
      "GA4_PRIVATE_KEY",
      "GA4_PROPERTY_ID",
      "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
    ]),
    status("Google Ads", adsDescription, adsRequired),
    status("Search Console", "網站資源 URL；HTML 驗證檔需置於 public/。", [
      "GOOGLE_SEARCH_CONSOLE_SITE_URL",
    ]),
    status("Merchant Center", "Merchant Center 帳號 ID。", [
      "GOOGLE_MERCHANT_CENTER_ACCOUNT_ID",
    ]),
  ];
}
