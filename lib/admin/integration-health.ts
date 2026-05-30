import {
  probeDatabase,
  probeGa4Reporting,
  probeGemini,
  probeGoogleAdsOAuth,
  probeRedis,
  probeSearchConsole,
  probeSupabaseStorage,
} from "@/infrastructure/health/probes";
import { fetchBigQueryHealth } from "@/services/google/bigquery";
import {
  deriveGcpProjectId,
  getGoogleIntegrationStatuses,
} from "@/lib/google/integration-status";
import type { ProbeResult } from "@/infrastructure/health/probes";
import type {
  IntegrationHealthItem,
  IntegrationHealthReport,
  IntegrationHealthState,
} from "@/lib/admin/integration-health.types";

export interface IntegrationHealthOptions {
  /** 儀表板已跑過 GA4 時傳入，避免重複並發探測 */
  ga4ReportingProbe?: ProbeResult;
  /** 儀表板已成功查詢 DB 時傳入，避免多一次 SELECT 1 探測 */
  databaseProbe?: ProbeResult;
}

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function missingKeys(keys: string[]) {
  return keys.filter((key) => !hasEnv(key));
}

function envOnlyItem(
  id: string,
  name: string,
  description: string,
  requiredEnv: string[]
): IntegrationHealthItem {
  const missing = missingKeys(requiredEnv);
  const status: IntegrationHealthState =
    missing.length === 0 ? "ok" : "missing";
  return { id, name, description, status, missing };
}

function googleId(name: string) {
  if (name === "GA4") return "ga4";
  return name.toLowerCase().replace(/\s+/g, "-");
}

function googleEnvItems(): IntegrationHealthItem[] {
  return getGoogleIntegrationStatuses().map((g) => ({
    id: googleId(g.name),
    name: g.name,
    description: g.description,
    status: (g.status === "connected" ? "ok" : "missing") as IntegrationHealthState,
    missing: g.missing,
  }));
}

function mergeProbe(
  base: IntegrationHealthItem,
  probe: { ok: boolean; message?: string }
): IntegrationHealthItem {
  if (base.status === "missing") return base;
  if (probe.ok) {
    return { ...base, status: "ok", detail: probe.message };
  }
  return {
    ...base,
    status: "error",
    detail: probe.message?.trim() || "連線失敗（請重啟 dev server）",
  };
}

async function probeItem(
  base: IntegrationHealthItem,
  probe: () => Promise<{ ok: boolean; message?: string }>
): Promise<IntegrationHealthItem> {
  if (base.status === "missing") return base;
  try {
    return mergeProbe(base, await probe());
  } catch (e) {
    const message = e instanceof Error ? e.message : "探測失敗";
    return { ...base, status: "error", detail: message };
  }
}

export function summarizeHealth(items: IntegrationHealthItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { ok: 0, missing: 0, error: 0 }
  );
}

function validateJwt(item: IntegrationHealthItem): IntegrationHealthItem {
  if (item.status !== "ok") return item;
  const accessLen = process.env["JWT_ACCESS_SECRET"]?.length ?? 0;
  const refreshLen = process.env["JWT_REFRESH_SECRET"]?.length ?? 0;
  if (accessLen < 64 || refreshLen < 64) {
    return {
      ...item,
      status: "error",
      detail: `長度不足（access ${accessLen}、refresh ${refreshLen}，需各 ≥64）`,
    };
  }
  return { ...item, detail: "金鑰長度符合要求" };
}

function validateTotp(item: IntegrationHealthItem): IntegrationHealthItem {
  if (item.status !== "ok") return item;
  const len = process.env["TOTP_ENCRYPTION_KEY"]?.length ?? 0;
  if (len !== 64) {
    return { ...item, status: "error", detail: `長度 ${len}（應為 64）` };
  }
  return { ...item, detail: "64 字元 hex 已設定" };
}

function bigQueryBase(): IntegrationHealthItem {
  const missing = missingKeys(["BIGQUERY_DATASET_ID"]);
  const projectId = deriveGcpProjectId();
  if (!projectId) {
    missing.push("GOOGLE_CLOUD_PROJECT_ID（或有效的 GA4_CLIENT_EMAIL）");
  }
  return {
    id: "google-bigquery",
    name: "BigQuery",
    description:
      "使用 GA4 服務帳號存取；需 IAM 角色 BigQuery Data Viewer。",
    status: missing.length === 0 ? "ok" : "missing",
    missing,
    detail: projectId ? `專案：${projectId}` : undefined,
  };
}

export async function runIntegrationHealthChecks(
  options: IntegrationHealthOptions = {}
): Promise<IntegrationHealthReport> {
  const googleEnv = googleEnvItems();
  const ga4Env = googleEnv.find((i) => i.id === "ga4") ?? {
    id: "ga4",
    name: "GA4",
    description: "",
    status: "missing" as const,
    missing: ["GA4_CLIENT_EMAIL", "GA4_PRIVATE_KEY", "GA4_PROPERTY_ID"],
  };
  const adsEnv = googleEnv.find((i) => i.id === "google-ads") ?? {
    id: "google-ads",
    name: "Google Ads",
    description: "",
    status: "missing" as const,
    missing: ["GOOGLE_ADS_CLIENT_ID"],
  };
  const gscEnv = googleEnv.find((i) => i.id === "search-console") ?? {
    id: "search-console",
    name: "Search Console",
    description: "",
    status: "missing" as const,
    missing: ["GOOGLE_SEARCH_CONSOLE_SITE_URL"],
  };
  const otherGoogle = googleEnv.filter(
    (i) => i.id !== "ga4" && i.id !== "google-ads" && i.id !== "search-console"
  );
  const gscLiveBase: IntegrationHealthItem = {
    id: "search-console-live",
    name: "Search Console API",
    description: "連線與資源權限探測",
    status: gscEnv.status,
    missing: gscEnv.missing,
  };

  const postgresBase = envOnlyItem(
    "postgres",
    "PostgreSQL",
    "Prisma 主資料庫",
    ["DATABASE_URL"]
  );
  const redisBase = envOnlyItem(
    "redis",
    "Upstash Redis",
    "Token 黑名單、Webhook nonce、AI Queue",
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]
  );
  const supabaseAdminBase = envOnlyItem(
    "supabase-admin",
    "Supabase Storage",
    "後台媒體上傳（Service Role）",
    ["SUPABASE_SERVICE_ROLE_KEY"]
  );
  const geminiBase = envOnlyItem(
    "gemini",
    "Gemini API",
    "Admin AI 助理",
    ["GEMINI_API_KEY"]
  );

  const ga4LiveBase: IntegrationHealthItem = {
    id: "ga4-reporting",
    name: "GA4 Reporting API",
    description: "即時探測 Analytics Data API",
    status: ga4Env.status,
    missing: ga4Env.missing,
  };

  const adsLiveBase: IntegrationHealthItem = {
    id: "google-ads-oauth",
    name: "Google Ads OAuth",
    description: "Refresh Token 換取 Access Token",
    status: adsEnv.status,
    missing: adsEnv.missing,
  };

  const ga4ProbePromise = options.ga4ReportingProbe
    ? Promise.resolve(mergeProbe(ga4LiveBase, options.ga4ReportingProbe))
    : probeItem(ga4LiveBase, probeGa4Reporting);

  const postgresPromise = options.databaseProbe
    ? Promise.resolve(mergeProbe(postgresBase, options.databaseProbe))
    : probeItem(postgresBase, probeDatabase);

  const gscLivePromise = probeItem(gscLiveBase, probeSearchConsole);

  const bigQueryEnv = bigQueryBase();

  const [postgres, redis, supabaseAdmin, gemini, ga4Live, adsLive, gscLive, bigQuery] =
    await Promise.all([
      postgresPromise,
      probeItem(redisBase, probeRedis),
      probeItem(supabaseAdminBase, probeSupabaseStorage),
      probeItem(geminiBase, probeGemini),
      ga4ProbePromise,
      probeItem(adsLiveBase, probeGoogleAdsOAuth),
      gscLivePromise,
      probeItem(bigQueryEnv, fetchBigQueryHealth),
    ]);

  const staticItems: IntegrationHealthItem[] = [
    envOnlyItem("supabase-public", "Supabase（公開）", "前端 anon 與 API URL", [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]),
    validateJwt(
      envOnlyItem("jwt", "JWT 簽章", "Access / Refresh（各 ≥64 字元）", [
        "JWT_ACCESS_SECRET",
        "JWT_REFRESH_SECRET",
      ])
    ),
    validateTotp(
      envOnlyItem("totp", "TOTP 加密金鑰", "2FA secret 加密", ["TOTP_ENCRYPTION_KEY"])
    ),
    envOnlyItem("webhook", "Webhook Secret", "外部 webhook HMAC", ["WEBHOOK_SECRET"]),
    envOnlyItem("cron", "Cron Secret", "排程 / AI Worker", ["CRON_SECRET"]),
    envOnlyItem("revalidate", "Revalidate Secret", "On-demand ISR", ["REVALIDATE_SECRET"]),
    envOnlyItem("redirect", "Redirect Lookup Secret", "轉址查詢簽章", [
      "REDIRECT_LOOKUP_SECRET",
    ]),
    envOnlyItem("pageview", "Pageview Hash Salt", "匿名瀏覽 hash", ["PAGEVIEW_HASH_SALT"]),
    envOnlyItem("site-url", "站點 URL", "canonical / OG", ["NEXT_PUBLIC_SITE_URL"]),
    envOnlyItem("alert-email", "告警信箱", "Job 失敗通知", ["ALERT_EMAIL_TO"]),
  ];

  const items: IntegrationHealthItem[] = [
    postgres,
    redis,
    ...staticItems,
    supabaseAdmin,
    gemini,
    ga4Env,
    ga4Live,
    adsEnv,
    adsLive,
    gscEnv,
    gscLive,
    ...otherGoogle,
    bigQuery,
  ];

  return {
    checkedAt: new Date().toISOString(),
    items,
    summary: summarizeHealth(items),
  };
}
