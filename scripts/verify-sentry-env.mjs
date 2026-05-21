#!/usr/bin/env node
/** 檢查 Sentry DSN 是否已設定（會自動讀取 .env.local） */
import { loadDotenvLocal } from "./load-dotenv-local.mjs";

loadDotenvLocal();

const dsn =
  process.env.SENTRY_DSN?.trim() ||
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
  "";

if (!dsn) {
  console.error(
    "[verify:sentry] 缺少 SENTRY_DSN 或 NEXT_PUBLIC_SENTRY_DSN（請寫入 .env.local）"
  );
  process.exit(1);
}

if (!dsn.includes("@") || !dsn.startsWith("https://")) {
  console.error("[verify:sentry] DSN 格式異常，請從 Sentry 專案設定複製");
  process.exit(1);
}

const org = process.env.SENTRY_ORG?.trim();
const project = process.env.SENTRY_PROJECT?.trim();
console.log("[verify:sentry] OK — DSN 已設定");
if (org && project) {
  console.log(`[verify:sentry] org=${org} project=${project}`);
}
