import { z } from "zod";

export const integrationProviderIdSchema = z.enum([
  "ga4",
  "gemini",
  "google_ads",
  "search_console",
  "bigquery",
  "merchant",
]);

export type IntegrationProviderId = z.infer<typeof integrationProviderIdSchema>;

export interface IntegrationFieldDef {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
}

export interface IntegrationProviderDef {
  id: IntegrationProviderId;
  name: string;
  description: string;
  fields: IntegrationFieldDef[];
  envKeys: string[];
}

export const INTEGRATION_PROVIDERS: IntegrationProviderDef[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Reporting API（服務帳號）",
    fields: [
      { key: "GA4_CLIENT_EMAIL", label: "服務帳號 Email", placeholder: "xxx@project.iam.gserviceaccount.com" },
      { key: "GA4_PRIVATE_KEY", label: "私鑰 (PEM)", secret: true, placeholder: "-----BEGIN PRIVATE KEY-----..." },
      { key: "GA4_PROPERTY_ID", label: "Property ID", placeholder: "536903218" },
      { key: "NEXT_PUBLIC_GA4_MEASUREMENT_ID", label: "Measurement ID", placeholder: "G-XXXXXXXX" },
    ],
    envKeys: [
      "GA4_CLIENT_EMAIL",
      "GA4_PRIVATE_KEY",
      "GA4_PROPERTY_ID",
      "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
    ],
  },
  {
    id: "gemini",
    name: "Gemini AI",
    description: "AI 洞察與內容助理",
    fields: [
      { key: "GEMINI_API_KEY", label: "API 金鑰", secret: true, placeholder: "AIza..." },
    ],
    envKeys: ["GEMINI_API_KEY"],
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description: "廣告 OAuth 與報表",
    fields: [
      { key: "GOOGLE_ADS_CLIENT_ID", label: "OAuth Client ID" },
      { key: "GOOGLE_ADS_CLIENT_SECRET", label: "Client Secret", secret: true },
      {
        key: "GOOGLE_ADS_REFRESH_TOKEN",
        label: "Refresh Token",
        secret: true,
        placeholder: "執行 npm run ads:oauth 取得；留空儲存時保留既有值",
      },
      { key: "GOOGLE_ADS_DEVELOPER_TOKEN", label: "Developer Token", secret: true },
      { key: "GOOGLE_ADS_CUSTOMER_ID", label: "Customer ID" },
    ],
    envKeys: [
      "GOOGLE_ADS_CLIENT_ID",
      "GOOGLE_ADS_CLIENT_SECRET",
      "GOOGLE_ADS_REFRESH_TOKEN",
      "GOOGLE_ADS_DEVELOPER_TOKEN",
      "GOOGLE_ADS_CUSTOMER_ID",
    ],
  },
  {
    id: "search_console",
    name: "Search Console",
    description: "搜尋成效（共用 GA4 服務帳號）",
    fields: [
      {
        key: "GOOGLE_SEARCH_CONSOLE_SITE_URL",
        label: "資源 URL",
        placeholder: "https://www.example.com/",
      },
    ],
    envKeys: ["GOOGLE_SEARCH_CONSOLE_SITE_URL"],
  },
  {
    id: "bigquery",
    name: "BigQuery",
    description:
      "使用 GA4 服務帳號；需在 GCP 為該帳號授予 BigQuery Data Viewer（見 docs/BIGQUERY-IAM-SETUP.md）",
    fields: [
      { key: "BIGQUERY_DATASET_ID", label: "Dataset ID" },
      { key: "GOOGLE_CLOUD_PROJECT_ID", label: "GCP 專案 ID（選填）" },
    ],
    envKeys: ["BIGQUERY_DATASET_ID", "GOOGLE_CLOUD_PROJECT_ID"],
  },
  {
    id: "merchant",
    name: "Merchant Center",
    description: "購物廣告帳戶",
    fields: [
      { key: "GOOGLE_MERCHANT_CENTER_ACCOUNT_ID", label: "Merchant 帳戶 ID" },
    ],
    envKeys: ["GOOGLE_MERCHANT_CENTER_ACCOUNT_ID"],
  },
];

export function getProviderDef(id: IntegrationProviderId) {
  const def = INTEGRATION_PROVIDERS.find((p) => p.id === id);
  if (!def) throw new Error(`未知整合：${id}`);
  return def;
}
