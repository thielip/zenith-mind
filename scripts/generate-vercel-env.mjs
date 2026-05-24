/**
 * 從 .env.local 產生 Vercel Bulk Import 用檔（勿提交 Git）
 * 用法：node scripts/generate-vercel-env.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, ".env.local");
const out = join(root, ".env.vercel-import");

const SKIP = new Set([
  "CF_PUBLIC_ONLY",
  "ADMIN_DEPLOYMENT_URL",
  "SKIP_ENV_VALIDATION",
  "GA4_OAUTH_CLIENT_ID",
  "GA4_OAUTH_CLIENT_SECRET",
  "NEXTJS_ENV",
]);

const OVERRIDES = {
  NEXT_PUBLIC_SITE_URL: "https://www.getzenithmind.com",
};

function parseEnv(content) {
  const out = {};
  let key = null;
  let buf = [];
  const flush = () => {
    if (!key) return;
    let val = buf.join("\n").trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val.replace(/\\n/g, "\n");
    key = null;
    buf = [];
  };
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) {
      flush();
      key = m[1];
      buf = [m[2] ?? ""];
    } else if (key) buf.push(line);
  }
  flush();
  return out;
}

const vars = parseEnv(readFileSync(src, "utf8"));
for (const k of Object.keys(OVERRIDES)) vars[k] = OVERRIDES[k];

const lines = [
  "# Vercel Production — Bulk Import（由 .env.local 產生，勿提交 Git）",
  "# 不要設：CF_PUBLIC_ONLY、ADMIN_DEPLOYMENT_URL",
  "# 首次登入後請刪除 ADMIN_BOOTSTRAP_*",
  "",
];

const order = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "TOTP_ENCRYPTION_KEY",
  "GEMINI_API_KEY",
  "GA4_CLIENT_EMAIL",
  "GA4_PRIVATE_KEY",
  "GA4_PROPERTY_ID",
  "GA4_ACCOUNT_ID",
  "WEBHOOK_SECRET",
  "CRON_SECRET",
  "REVALIDATE_SECRET",
  "REDIRECT_LOOKUP_SECRET",
  "PAGEVIEW_HASH_SALT",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
  "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
  "GOOGLE_SEARCH_CONSOLE_SITE_URL",
  "GSC_OAUTH_CLIENT_ID",
  "GSC_OAUTH_CLIENT_SECRET",
  "GSC_OAUTH_REFRESH_TOKEN",
  "GOOGLE_MERCHANT_CENTER_ACCOUNT_ID",
  "BIGQUERY_DATASET_ID",
  "ALERT_EMAIL_USER",
  "ALERT_EMAIL_PASS",
  "ALERT_EMAIL_TO",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
  "ADMIN_BOOTSTRAP_EMAIL",
  "ADMIN_BOOTSTRAP_PASSWORD",
];

const used = new Set();
for (const key of order) {
  if (SKIP.has(key) || vars[key] === undefined) continue;
  used.add(key);
  const v = vars[key];
  const needsQuote = /[\s#"'\\]/.test(v) || v.includes("\n");
  lines.push(
    needsQuote ? `${key}="${v.replace(/\n/g, "\\n")}"` : `${key}=${v}`
  );
}

for (const [key, v] of Object.entries(vars)) {
  if (used.has(key) || SKIP.has(key)) continue;
  const needsQuote = /[\s#"'\\]/.test(v) || v.includes("\n");
  lines.push(
    needsQuote ? `${key}="${v.replace(/\n/g, "\\n")}"` : `${key}=${v}`
  );
}

writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${out} (${order.filter((k) => vars[k]).length}+ keys)`);
