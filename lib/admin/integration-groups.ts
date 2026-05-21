import type { IntegrationHealthItem } from "@/lib/admin/integration-health.types";

export type IntegrationCategory =
  | "core"
  | "security"
  | "google"
  | "other";

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  core: "核心資料庫",
  security: "安全與金鑰",
  google: "Google 生態系",
  other: "其他串接",
};

const ID_CATEGORY: Record<string, IntegrationCategory> = {
  postgres: "core",
  redis: "core",
  "supabase-admin": "core",
  "supabase-public": "core",
  jwt: "security",
  totp: "security",
  webhook: "security",
  cron: "security",
  revalidate: "security",
  redirect: "security",
  pageview: "security",
  "site-url": "security",
  "alert-email": "security",
  gemini: "google",
  ga4: "google",
  "ga4-reporting": "google",
  "google-ads": "google",
  "google-ads-oauth": "google",
  "search-console": "google",
  "search-console-live": "google",
  bigquery: "google",
  merchant: "google",
};

export function integrationCategory(id: string): IntegrationCategory {
  const mapped = ID_CATEGORY[id];
  if (mapped) return mapped;
  if (id.startsWith("google") || id.includes("ga4") || id.includes("gemini")) {
    return "google";
  }
  return "other";
}

export function categoryLabel(cat: IntegrationCategory): string {
  return CATEGORY_LABELS[cat];
}

export function groupIntegrationsByCategory(
  items: IntegrationHealthItem[]
): Record<IntegrationCategory, IntegrationHealthItem[]> {
  const groups: Record<IntegrationCategory, IntegrationHealthItem[]> = {
    core: [],
    security: [],
    google: [],
    other: [],
  };
  for (const item of items) {
    groups[integrationCategory(item.id)].push(item);
  }
  return groups;
}

export function buildIntegrationDiagnostics(
  items: IntegrationHealthItem[]
): string[] {
  const lines: string[] = [];
  for (const item of items) {
    if (item.status === "missing" && item.missing.length > 0) {
      lines.push(`缺少 ${item.name}：${item.missing.join(", ")}`);
    }
    if (item.status === "error" && item.detail) {
      lines.push(`${item.name}：${item.detail}`);
    }
  }
  return lines.slice(0, 12);
}
