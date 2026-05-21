#!/usr/bin/env node
/** Cloudflare Pages / Workers Git 建置前環境檢查 */
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const optional = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_DSN",
  "SENTRY_AUTH_TOKEN",
  "ADMIN_DEPLOYMENT_URL",
];

let failed = false;
for (const key of required) {
  const v = process.env[key]?.trim();
  if (!v) {
    console.error(`[verify:cf-build] 缺少必要變數: ${key}`);
    failed = true;
  }
}

for (const key of optional) {
  const v = process.env[key]?.trim();
  console.log(`[verify:cf-build] ${key}: ${v ? "set" : "—"}`);
}

if (process.env.SENTRY_ORG && !process.env.SENTRY_AUTH_TOKEN) {
  console.warn(
    "[verify:cf-build] 已設 SENTRY_ORG 但無 SENTRY_AUTH_TOKEN — 建置將略過 source map 上傳（正常）"
  );
}

if (failed) process.exit(1);
console.log("[verify:cf-build] OK");
