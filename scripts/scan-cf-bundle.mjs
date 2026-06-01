#!/usr/bin/env node
/**
 * 掃描 OpenNext CF bundle，禁止 admin-only 模組與常見 secret 字串。
 * 用法：npm run build:cf 成功後執行 node scripts/scan-cf-bundle.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const openNextRoot = join(root, ".open-next");

const FORBIDDEN_STRINGS = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "GA4_PRIVATE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "TOTP_ENCRYPTION_KEY",
  "ADMIN_BOOTSTRAP_PASSWORD",
  "CRON_SECRET",
];

const FORBIDDEN_PATH_SNIPPETS = [
  "app/api/admin",
  "app/api/ai/jobs",
  "app/api/auth/login",
  "app/api/cron/",
];

function main() {
  if (!existsSync(openNextRoot)) {
    console.error("[scan-cf-bundle] 缺少 .open-next/，請先 npm run build:cf");
    process.exit(1);
  }

  const targets = [
    join(openNextRoot, "worker.js"),
    join(openNextRoot, "cloudflare", "next-env.mjs"),
    join(openNextRoot, "cloudflare", "worker.js"),
  ].filter((p) => existsSync(p));
  if (targets.length === 0) {
    console.error("[scan-cf-bundle] 找不到 worker bundle 檔案");
    process.exit(1);
  }
  let failed = 0;

  for (const file of targets) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (text.length > 2_000_000) continue;

    for (const needle of FORBIDDEN_STRINGS) {
      if (text.includes(needle)) {
        console.error(`[scan-cf-bundle] FAIL secret key ${needle} in ${file}`);
        failed += 1;
      }
    }
    for (const needle of FORBIDDEN_PATH_SNIPPETS) {
      if (text.includes(needle)) {
        console.error(`[scan-cf-bundle] FAIL forbidden snippet "${needle}" in ${file}`);
        failed += 1;
      }
    }
  }

  if (failed > 0) {
    console.error(`[scan-cf-bundle] ${failed} violation(s)`);
    process.exit(1);
  }

  console.log(`[scan-cf-bundle] OK (${targets.length} files scanned)`);
}

main();
