/**
 * 部署平面 env 清單（僅 key 名稱，不含 secret 值）
 * 供 scripts/check-env-keys.mjs --diff 比對 Vercel / Cloudflare / 本機
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvExampleKeys(filename) {
  const text = readFileSync(join(root, filename), "utf8");
  const keys = new Set();
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

function parseWranglerVarKeys() {
  const text = readFileSync(join(root, "wrangler.toml"), "utf8");
  const keys = new Set();
  let inVars = false;
  for (const line of text.split("\n")) {
    if (line.trim() === "[vars]") {
      inVars = true;
      continue;
    }
    if (inVars && line.trim().startsWith("[")) break;
    if (!inVars) continue;
    const m = line.match(/^([A-Z][A-Z0-9_]*)\s*=/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

/** Vercel 全站 / 本機 .env.local 應具備的 server + client keys（來自 .env.example） */
export const VERCEL_LOCAL_KEYS = parseEnvExampleKeys(".env.example");

/** Cloudflare wrangler.toml [vars] 已宣告的公開變數 */
export const CF_WRANGLER_VAR_KEYS = parseWranglerVarKeys();

/** 分裂部署：CF Worker 執行公開站時必須具備（vars 或 secret） */
export const CF_RUNTIME_REQUIRED_KEYS = [
  "CF_WORKER_RUNTIME",
  "ADMIN_DEPLOYMENT_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "REDIRECT_LOOKUP_SECRET",
  "REVALIDATE_SECRET",
  "PAGEVIEW_HASH_SALT",
  "JWT_ACCESS_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "WEBHOOK_SECRET",
];

/** Vercel 後台 / Cron / AI 額外關鍵（不在 CF 公開 bundle） */
export const VERCEL_ADMIN_REQUIRED_KEYS = [
  "DIRECT_URL",
  "JWT_REFRESH_SECRET",
  "TOTP_ENCRYPTION_KEY",
  "GEMINI_API_KEY",
  "GA4_CLIENT_EMAIL",
  "GA4_PRIVATE_KEY",
  "GA4_PROPERTY_ID",
  "CRON_SECRET",
];

/** 絕不可出現在 wrangler.toml [vars] 的 secret（應使用 wrangler secret put） */
export const MUST_NOT_BE_WRANGLER_VARS = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "DATABASE_URL",
  "GEMINI_API_KEY",
  "GA4_PRIVATE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "WEBHOOK_SECRET",
  "CRON_SECRET",
  "TOTP_ENCRYPTION_KEY",
];

/** 本機 ops 建議檢查（與原 check-env-keys 相容） */
export const LOCAL_OPS_OPTIONAL_KEYS = [
  "REVALIDATE_SECRET",
  "REDIRECT_LOOKUP_SECRET",
  "BIGQUERY_DATASET_ID",
  "GOOGLE_CLOUD_PROJECT_ID",
];
