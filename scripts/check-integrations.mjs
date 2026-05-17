/**
 * 本機連線探測（讀取 .env.local，不輸出 secret 值）
 * 用法：node --env-file=.env.local scripts/check-integrations.mjs
 */
import { readFileSync, existsSync } from "node:fs";

if (!existsSync(".env.local")) {
  console.error("缺少 .env.local，請先設定環境變數");
  process.exit(1);
}

// Node 20+ --env-file 應已載入；此處僅確認檔案存在
readFileSync(".env.local", "utf8");

const { runIntegrationHealthChecks } = await import(
  "../lib/admin/integration-health.ts"
);

const report = await runIntegrationHealthChecks();
for (const item of report.items) {
  const flag =
    item.status === "ok" ? "OK" : item.status === "missing" ? "MISSING" : "ERROR";
  console.log(`[${flag}] ${item.name}${item.detail ? ` — ${item.detail}` : ""}`);
  if (item.missing.length) console.log(`       missing: ${item.missing.join(", ")}`);
}
console.log(
  `\nSummary: ok=${report.summary.ok} missing=${report.summary.missing} error=${report.summary.error}`
);
process.exit(report.summary.error > 0 || report.summary.missing > 0 ? 1 : 0);
