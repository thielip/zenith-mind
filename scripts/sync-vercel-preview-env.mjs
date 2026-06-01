/**
 * 將 .env.local 的 server/client 變數同步至 Vercel Preview（PR 部署用）
 * 用法：npx tsx --env-file=.env.local scripts/sync-vercel-preview-env.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const TARGET = "preview";
/** Vercel Preview 需指定 Git branch（CLI 54+）；設 ALL_PREVIEW=1 則略過 branch 參數 */
const GIT_BRANCH =
  process.env["VERCEL_SYNC_BRANCH"] ?? "feat/phase-3-command-center-registry";
const USE_ALL_PREVIEW = process.env["ALL_PREVIEW"] === "1";

/** env.ts build/runtime 所需（與 Production 對齊） */
const KEYS = [
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
  "WEBHOOK_SECRET",
  "REVALIDATE_SECRET",
  "CRON_SECRET",
  "PAGEVIEW_HASH_SALT",
  "REDIRECT_LOOKUP_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
  "NEXT_PUBLIC_SENTRY_DSN",
  "GSC_OAUTH_CLIENT_ID",
  "GSC_OAUTH_CLIENT_SECRET",
  "GSC_OAUTH_REFRESH_TOKEN",
  "GOOGLE_SEARCH_CONSOLE_SITE_URL",
];

function addEnv(key, val) {
  console.log(`→ ${key} (${TARGET})`);
  spawnSync("npx", ["vercel", "env", "rm", key, TARGET, "--yes"], {
    stdio: "ignore",
    shell: true,
  });
  const addArgs = ["vercel", "env", "add", key, TARGET];
  if (!USE_ALL_PREVIEW) addArgs.push(GIT_BRANCH);
  addArgs.push("--value", val, "--yes", "--force");
  const add = spawnSync("npx", addArgs, { stdio: "inherit", shell: true });
  if (add.status !== 0) {
    console.error(`FAIL ${key}`);
    process.exit(add.status ?? 1);
  }
}

let synced = 0;
for (const key of KEYS) {
  const val = process.env[key]?.trim();
  if (!val) {
    console.warn(`SKIP ${key}: missing in .env.local`);
    continue;
  }
  addEnv(key, val);
  synced += 1;
}

if (synced < 10) {
  console.error("Too few vars synced; check .env.local");
  process.exit(1);
}

console.log(`Done: ${synced} Preview env vars synced. Redeploy PR on Vercel.`);
