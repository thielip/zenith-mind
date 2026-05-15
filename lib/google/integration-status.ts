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

export function getGoogleIntegrationStatuses(): GoogleIntegrationStatus[] {
  return [
    status("GA4", "已使用 Reporting API 串流工作階段、瀏覽量、活躍使用者與熱門頁面。", [
      "GA4_CLIENT_EMAIL",
      "GA4_PRIVATE_KEY",
      "GA4_PROPERTY_ID",
      "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
    ]),
    status(
      "Google Ads",
      "需 OAuth Client、Refresh Token、Developer Token；MCC 帳戶另需 LOGIN_CUSTOMER_ID。",
      [
        "GOOGLE_ADS_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN",
        "GOOGLE_ADS_DEVELOPER_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID",
      ]
    ),
    status("Search Console", "需授權服務帳號或 OAuth，並提供網站資源 URL。", [
      "GOOGLE_SEARCH_CONSOLE_SITE_URL",
    ]),
    status("Merchant Center", "需 Merchant Center 帳號 ID 與 Content API 權限。", [
      "GOOGLE_MERCHANT_CENTER_ACCOUNT_ID",
    ]),
    status("BigQuery", "需專案 ID、資料集 ID，並授權服務帳號 BigQuery Data Viewer/Job User。", [
      "GOOGLE_CLOUD_PROJECT_ID",
      "BIGQUERY_DATASET_ID",
    ]),
  ];
}
